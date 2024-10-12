import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  DashboardResBody,
  DashboardWeeklySummary, OvertimePatchResBody,
  ReportResBody,
} from '../dto/monitoring.dto';
import {
  DaySummary,
  PrismaAttendanceDashboard,
  PrismaAttendanceReport,
} from 'src/interfaces/monitoring.interfaces';
import { PrismaService } from './prisma.service';
import { LoggerUtil } from '../utils/logger.utils';
import { getDate, getDateString } from '../utils/date.utils';

@Injectable()
export class MonitoringService {
  private readonly logger = new LoggerUtil('MonitoringService');
  private static DAYS = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];

  public constructor(private readonly prisma: PrismaService) {}

  private getDateWeek(today: Date): { monday: Date; saturday: Date } {
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);

    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);

    return { monday, saturday };
  }

  private getSummaryCount(
    attendances: PrismaAttendanceDashboard[],
  ): DaySummary {
    const summary: DaySummary = { presence: 0, permit: 0, absent: 0 };
    attendances.forEach(({ status }) => summary[status]++);
    return summary;
  }

  private getDaySummary(
    attendances: PrismaAttendanceDashboard[],
    day: number,
  ): DaySummary {
    const dayData = attendances.filter(
      (attendance) => attendance.date.getDay() === day,
    );
    return this.getSummaryCount(dayData);
  }

  public async handleDashboard(): Promise<DashboardResBody> {
    const today = getDate(getDateString(new Date()));
    const { monday, saturday } = this.getDateWeek(today);

    const attendances: PrismaAttendanceDashboard[] =
      await this.prisma.attendance.findMany({
        where: {
          date: {
            gte: monday, // greater than equal
            lte: saturday, // less than equal
          },
        },
        select: {
          date: true,
          status: true,
        },
      });

    const todayData: PrismaAttendanceDashboard[] = attendances.filter(
      (attendance) => attendance.date.toISOString() === today.toISOString(),
    );
    const {
      presence: todayPresence,
      permit: todayPermit,
      absent: todayAbsent,
    } = this.getSummaryCount(todayData);

    const weeklySummary = {} as DashboardWeeklySummary;
    for (let day = 1; day <= 6; day++) {
      weeklySummary[MonitoringService.DAYS[day - 1]] = this.getDaySummary(
        attendances,
        day,
      );
    }

    return {
      date: getDateString(today),
      total_presence: todayPresence,
      total_permit: todayPermit,
      total_absent: todayAbsent,
      weekly_summary: weeklySummary,
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
      this.logger.error(error);
      throw new InternalServerErrorException();
    }

    return ReportResBody.getReport(attendances);
  }

  public async handleUpdateOvertime(
    id: number,
    approved: boolean,
  ): Promise<OvertimePatchResBody> {
    const existingOvertime = await this.prisma.overtime.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingOvertime) {
      throw new NotFoundException('data lembur tidak ditemukan');
    }

    return this.prisma.overtime.update({
      where: { id },
      data: { approved, checked: true },
      select: { id: true, approved: true },
    });
  }
}
