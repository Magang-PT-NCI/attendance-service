import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EmployeeResData } from '../interfaces/api-service.interfaces';
import {
  AttendancePostReqBody,
  AttendancePostResBody,
  AttendanceResBody,
} from '../dto/attendance.dto';
import {
  PrismaAttendance,
  PrismaCheckAttendance,
} from '../interfaces/attendance.interfaces';
import { PrismaService } from './prisma.service';
import { getEmployee } from '../utils/api.utils';
import { getDate, getDateString, getTimeString } from '../utils/date.utils';
import { uploadFile } from '../utils/upload.utils';
import { ActivityStatus, Prisma } from '@prisma/client';
import { LoggerUtil } from '../utils/logger.utils';
import { handleError } from '../utils/common.utils';

@Injectable()
export class AttendanceService {
  private readonly logger = new LoggerUtil('AttendanceService');

  constructor(private readonly prisma: PrismaService) {}

  public async handleGetAttendance(
    nik: string,
    filter: string,
    date: string,
  ): Promise<AttendanceResBody> {
    const employee = await getEmployee(nik);
    if (!employee) throw new NotFoundException('karyawan tidak ditemukan');

    const where: Prisma.AttendanceWhereInput = { nik, date: getDate(date) };
    const select = this.buildSelectGetAttendance(filter);

    const attendance: PrismaAttendance = await this.prisma.attendance.findFirst(
      { where, select },
    );
    return attendance ? new AttendanceResBody(attendance) : null;
  }

  async handleCheckIn(data: AttendancePostReqBody, employee: EmployeeResData) {
    const { nik, location, type, photo } = data;
    const { current, currentDateIso, currentTimeIso } = this.getCurrentDate();

    this.validateCheckInTime(current);
    await this.checkExistingAttendance(nik, currentDateIso);

    const filename = await uploadFile(photo, nik, type);
    const checkIn = await this.prisma.check.create({
      data: {
        type: 'in',
        time: currentTimeIso,
        location: `${location.latitude},${location.longitude}`,
        photo: filename,
      },
    });

    await this.updateEmployeeCache(nik, employee);
    await this.prisma.attendance.create({
      data: {
        nik,
        check_in_id: checkIn.id,
        date: currentDateIso,
        status: 'presence',
      },
    });

    return new AttendancePostResBody(data, filename, current);
  }

  async handleCheckOut(data: AttendancePostReqBody) {
    const { nik, location, type, photo } = data;
    const { current, currentDateIso, currentTimeIso } = this.getCurrentDate();

    const attendance = await this.getAttendanceData(nik, currentDateIso, true);

    if (!attendance?.checkIn) {
      throw new ConflictException('tidak dapat check out sebelum check in');
    }

    if (attendance.check_out_id) {
      throw new ConflictException('check out telah dilakukan');
    }

    const filename = await uploadFile(photo, nik, type);
    const checkOut = await this.prisma.check.create({
      data: {
        type: 'out',
        time: currentTimeIso,
        location: `${location.latitude},${location.longitude}`,
        photo: filename,
      },
    });

    await this.prisma.attendance.update({
      where: { id: attendance.id },
      data: { check_out_id: checkOut.id },
    });

    return new AttendancePostResBody(data, filename, current);
  }

  private async updateEmployeeCache(nik: string, employee: EmployeeResData) {
    const cachedEmployee = await this.prisma.employeeCache.findUnique({
      where: { nik },
    });

    try {
      if (cachedEmployee && employee.name !== cachedEmployee.name)
        await this.prisma.employeeCache.update({
          where: { nik },
          data: { name: employee.name },
        });
      else if (!cachedEmployee)
        await this.prisma.employeeCache.create({
          data: { nik: employee.nik, name: employee.name },
        });
    } catch (error) {
      handleError(error, this.logger);
    }
  }

  private buildSelectGetAttendance(filter: string): Prisma.AttendanceSelect {
    return {
      id: true,
      date: true,
      status: true,
      checkIn: { select: { time: true, location: true, photo: true } },
      checkOut: { select: { time: true, location: true, photo: true } },
      activities: {
        select: {
          id: true,
          description: true,
          status: true,
          start_time: true,
          end_time: true,
        },
        where:
          filter !== 'all' ? { status: filter as ActivityStatus } : undefined,
      },
      permit: true,
    };
  }

  private getCurrentDate() {
    const current = getDate(new Date().toISOString());
    return {
      current,
      currentDateIso: getDate(getDateString(current)).toISOString(),
      currentTimeIso: getDate(getTimeString(current)).toISOString(),
    };
  }

  private validateCheckInTime(current: Date) {
    const hour = current.getHours();
    const minute = current.getMinutes();

    if (hour < 6)
      throw new ConflictException(
        'tidak dapat melakukan check in sebelum pukul 06:00',
      );

    if (hour > 9 || (hour >= 9 && minute > 0))
      throw new ConflictException(
        'tidak dapat melakukan check in setelah pukul 09:00',
      );
  }

  private async getAttendanceData(
    nik: string,
    date: string,
    includeCheckIn: boolean = false,
  ): Promise<PrismaCheckAttendance> {
    try {
      return await this.prisma.attendance.findFirst({
        where: {
          nik,
          date,
        },
        select: {
          id: true,
          check_out_id: true,
          checkIn: includeCheckIn ? { select: { id: true } } : false,
        },
      });
    } catch (error) {
      handleError(error, this.logger);
    }
  }

  private async checkExistingAttendance(nik: string, date: string) {
    if (await this.getAttendanceData(nik, date))
      throw new ConflictException(
        'karyawan telah melakukan check in atau memiliki izin yang telah disetujui',
      );
  }
}
