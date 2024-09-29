import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../utils/prisma.utils';
import { EmployeeResData } from '../interfaces/api-service.interfaces';
import { ApiUtils } from '../utils/api.utils';
import { DateUtils } from '../utils/date.utils';
import {
  AttendancePostReqBody, AttendancePostResBody,
  AttendanceResBody,
} from '../dto/attendance.dto';
import { PrismaAttendance } from '../interfaces/attendance.interfaces';
import { FILE_DESTINATION } from '../config/app.config';
import { UploadUtil } from '../utils/upload.utils';

@Injectable()
export class AttendanceService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  async handleGetAttendanceByNik(nik: string, filter: string, date: string) {
    const employee: EmployeeResData = await ApiUtils.getEmployee(nik);

    if (!employee) {
      throw new NotFoundException('karyawan tidak ditemukan');
    }

    const where = {
      nik,
      date: DateUtils.setDate(date).getDateIso(),
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

  async handleGetAttendance() {
    throw new NotImplementedException();
  }

  async handleCheckIn(data: AttendancePostReqBody) {
    const { nik, location, type, photo } = data;

    DateUtils.setDate();
    const dateUtils = DateUtils.getInstance();
    const current = dateUtils.getDate();

    if (current.getHours() < 6) {
      throw new BadRequestException(
        'tidak dapat melakukan check in sebelum pukul 06:00',
      );
    }

    if (
      current.getHours() > 9 ||
      (current.getHours() >= 9 && current.getMinutes() > 0)
    ) {
      throw new BadRequestException(
        'tidak dapat melakukan check in setelah pukul 09:00',
      );
    }

    const existingAttendance = await this.prisma.attendance.findFirst({
      where: {
        nik,
        date: dateUtils.getDateIso(),
      },
    });

    if (existingAttendance) {
      throw new ConflictException(
        'karyawan telah melakukan check in atau memiliki izin yang telah disetujui',
      );
    }

    let filename: string = '';

    if (FILE_DESTINATION === 'cloud') {
      UploadUtil.uploadToDrive();
    } else {
      filename = UploadUtil.uploadToLocal(photo, nik, type, dateUtils);
    }

    const checkIn = await this.prisma.check.create({
      data: {
        type: 'in',
        time: dateUtils.getTimeIso(),
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
        date: dateUtils.getDateIso(),
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

    return new AttendancePostResBody(data, filename, dateUtils);
  }

  async handleCheckOut(body: AttendancePostReqBody) {
    return;
  }

  private async updateEmployeeCache(nik: string) {
    const employee = await ApiUtils.getEmployee(nik);
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
