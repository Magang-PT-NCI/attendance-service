import {
  Injectable,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../utils/prisma.utils';
import { EmployeeResData } from '../interfaces/api-service.interfaces';
import { ApiUtils } from '../utils/api.utils';
import { DateUtils } from '../utils/date.utils';
import { AttendanceResBody } from '../dto/attendance.dto';
import { PrismaAttendance } from '../interfaces/attendance.interfaces';

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

  async handleCheckIn() {
    return;
  }

  async handleCheckOut() {
    return;
  }
}
