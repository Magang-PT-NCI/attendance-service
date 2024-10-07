import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { EmployeeResData } from '../interfaces/api-service.interfaces';
import {
  AttendancePostReqBody,
  AttendancePostResBody,
  AttendanceResBody,
} from '../dto/attendance.dto';
import { PrismaAttendance } from '../interfaces/attendance.interfaces';
import { FILE_DESTINATION } from '../config/app.config';
import { PrismaService } from './prisma.service';
import { getEmployee } from '../utils/api.utils';
import { getDate, getDateString, getTimeString } from '../utils/date.utils';
import { uploadToDrive, uploadToLocal } from '../utils/upload.utils';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async handleGetAttendance(nik: string, filter: string, date: string) {
    const employee: EmployeeResData = await getEmployee(nik);

    if (!employee) {
      throw new NotFoundException('karyawan tidak ditemukan');
    }

    const where = {
      nik,
      date: getDate(date),
    };

    const checkSelect = {
      select: {
        time: true,
        location: true,
        photo: true,
      },
    };

    const activitySelect = {
      select: {
        id: true,
        description: true,
        status: true,
        start_time: true,
        end_time: true,
      },
      where: {},
    };

    const select = {
      id: true,
      date: true,
      status: true,
      checkIn: checkSelect,
      checkOut: checkSelect,
      activities: activitySelect,
      permit: true,
    };

    if (filter !== 'all') {
      select.activities.where = { status: filter };
    }

    const attendance: PrismaAttendance = await this.prisma.attendance.findFirst(
      {
        where,
        select,
      },
    );

    return attendance ? new AttendanceResBody(attendance) : null;
  }

  async handleCheckIn(data: AttendancePostReqBody) {
    const { nik, location, type, photo } = data;

    const current = getDate(new Date().toISOString());
    const currentDateIso = getDate(getDateString(current)).toISOString();
    const currentTimeIso = getDate(getTimeString(current)).toISOString();

    if (current.getHours() < 6) {
      throw new ConflictException(
        'tidak dapat melakukan check in sebelum pukul 06:00',
      );
    }

    if (
      current.getHours() > 9 ||
      (current.getHours() >= 9 && current.getMinutes() > 0)
    ) {
      throw new ConflictException(
        'tidak dapat melakukan check in setelah pukul 09:00',
      );
    }

    const existingAttendance = await this.prisma.attendance.findFirst({
      where: {
        nik,
        date: currentDateIso,
      },
    });

    if (existingAttendance) {
      throw new ConflictException(
        'karyawan telah melakukan check in atau memiliki izin yang telah disetujui',
      );
    }

    let filename: string = '';

    if (FILE_DESTINATION === 'cloud') {
      filename = await uploadToDrive(photo, nik, type);
    } else {
      filename = uploadToLocal(photo, nik, type);
    }

    const checkIn = await this.prisma.check.create({
      data: {
        type: 'in',
        time: currentTimeIso,
        location,
        photo: filename,
      },
    });

    const employeeCache = await this.updateEmployeeCache(nik);

    if (!employeeCache) {
      throw new InternalServerErrorException();
    }

    await this.prisma.attendance.create({
      data: {
        nik,
        check_in_id: checkIn.id,
        date: currentDateIso,
        status: 'presence',
      },
    });

    // const late = CommonUtils.getLate(dateUtils.getDate());
    // if (late) {
    //   const employee = await this.prisma.employeeCache.findFirst({
    //     where: { nik },
    //     select: {
    //       nik: false,
    //       name: true,
    //     },
    //   });

    // sendNotification({
    //   nik: employee.nik,
    //   name: employee.name,
    //   time: timeUtc,
    //   message: late.message,
    //   action: {
    //     data: null,
    //     need: false,
    //     type: null,
    //   },
    // });
    // }

    return new AttendancePostResBody(data, filename, current);
  }

  async handleCheckOut(data: AttendancePostReqBody) {
    const { nik, location, type, photo } = data;

    const current = getDate(new Date().toISOString());
    const currentDateIso = getDate(getDateString(current)).toISOString();
    const currentTimeIso = getDate(getTimeString(current)).toISOString();

    const attendance = await this.prisma.attendance.findFirst({
      where: {
        nik,
        date: currentDateIso,
      },
      include: { checkIn: true },
    });

    // not checked in yet
    if (!attendance?.checkIn) {
      throw new ConflictException('tidak dapat check out sebelum check in');
    }

    // already checked out
    if (attendance.check_out_id) {
      throw new ConflictException('check out telah dilakukan');
    }

    let filename: string = '';

    if (FILE_DESTINATION === 'cloud') {
      filename = await uploadToDrive(photo, nik, type);
    } else {
      filename = uploadToLocal(photo, nik, type);
    }

    const checkOut = await this.prisma.check.create({
      data: {
        type: 'out',
        time: currentTimeIso,
        location,
        photo: filename,
      },
    });

    await this.prisma.attendance.update({
      where: { id: attendance.id },
      data: { check_out_id: checkOut.id },
    });

    return new AttendancePostResBody(data, filename, current);
  }

  private async updateEmployeeCache(nik: string) {
    const employee = await getEmployee(nik);
    let cachedEmployee = await this.prisma.employeeCache.findFirst({
      where: { nik },
    });

    if (employee) {
      if (cachedEmployee) {
        if (employee.name !== cachedEmployee.name) {
          await this.prisma.employeeCache.update({
            where: { nik },
            data: {
              name: employee.name,
            },
          });
        }
      } else {
        cachedEmployee = await this.prisma.employeeCache.create({
          data: {
            nik: employee.nik,
            name: employee.name,
          },
        });
      }
    }

    return cachedEmployee;
  }
}
