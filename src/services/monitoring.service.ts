import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../utils/prisma.utils';
import { ReportResBody } from '../dto/monitoring.dto';
import { PrismaAttendanceReport } from 'src/interfaces/monitoring.interfaces';
import { logFormat, logger } from '../utils/logger.utils';
import { DateUtils } from '../utils/date.utils';

@Injectable()
export class MonitoringService {
  private static DAYS = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];

  private prisma: PrismaClient;

  public constructor() {
    this.prisma = getPrismaClient();
  }

  private getDateWeek(dateUtil: DateUtils): { monday: Date; saturday: Date } {
    const today = dateUtil.getDate();
    const dayOfWeek = today.getDay();

    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);

    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);

    return { monday, saturday };
  }

  private getSummaryCount(attendances) {
    const summary = { presence: 0, permit: 0, absent: 0 };
    attendances.forEach(({ status }) => summary[status]++);
    return summary;
  }

  private getDaySummary(attendances, day) {
    const dayData = attendances.filter(
      (attendance) => attendance.date.getDay() === day,
    );
    return this.getSummaryCount(dayData);
  }

  public async handleDashboard() {
    const dateUtil = DateUtils.setDate();
    const { monday, saturday } = this.getDateWeek(dateUtil);

    const attendances = await this.prisma.attendance.findMany({
      where: {
        date: {
          gte: monday, // greater then equal
          lte: saturday, // less then equal
        },
      },
      select: {
        nik: true,
        date: true,
        status: true,
        employee: { select: { name: true } },
        checkIn: { select: { time: true } },
        permit: true,
      },
    });

    const todayData = attendances.filter(
      (attendance) => attendance.date.toISOString() === dateUtil.getDateIso(),
    );
    const {
      presence: todayPresence,
      permit: todayPermit,
      absent: todayAbsent,
    } = this.getSummaryCount(todayData);

    const weeklySummary = {};
    for (let day = 1; day <= 6; day++) {
      weeklySummary[MonitoringService.DAYS[day - 1]] = this.getDaySummary(
        attendances,
        day,
      );
    }

    // const notifications = await this.getNotifications(todayData);

    return {
      date: dateUtil.getDateString(),
      total_presence: todayPresence,
      total_permit: todayPermit,
      total_absent: todayAbsent,
      weekly_summary: weeklySummary,
      // notifications,
    };
  }

  public async handleReport(
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
