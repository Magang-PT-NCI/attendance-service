import {
  Injectable,
  InternalServerErrorException,
  NotImplementedException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../utils/prisma.utils';
import { ReportResBody } from '../dto/monitoring.dto';
import { PrismaAttendanceReport } from 'src/interfaces/monitoring.interfaces';
import { logFormat, logger } from '../utils/logger.utils';

@Injectable()
export class MonitoringService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  async handleDashboard() {
    throw new NotImplementedException();
  }

  async handleReport(
    keyword: string,
    from: Date,
    to: Date,
  ): Promise<ReportResBody[]> {
    const dateCondition = {
      gte: from, // greater than equal
      lte: to, // less than equal
    };

    const nikCondition = { nik: { contains: keyword } };
    const nameCondition = { employee: { name: { contains: keyword } } };

    const checkSelect = { select: { time: true } };

    const include = {
      employee: { select: { nik: true, name: true } },
      checkIn: checkSelect,
      checkOut: checkSelect,
    };

    let attendances: PrismaAttendanceReport[];
    try {
      attendances = await this.prisma.attendance.findMany({
        where: {
          date: dateCondition,
          OR: [nikCondition, nameCondition],
        },
        include,
      });
    } catch (error) {
      logger.error(logFormat(error));
      throw new InternalServerErrorException();
    }

    return ReportResBody.getReport(attendances);
  }
}
