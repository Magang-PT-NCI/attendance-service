import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from './prisma.service';
import { LoggerUtil } from '../utils/logger.utils';
import { getDate, getDateString } from '../utils/date.utils';
import { Prisma } from '@prisma/client';

@Injectable()
export class CronJobService {
  private readonly logger = new LoggerUtil('CronJobService');

  constructor(private readonly prisma: PrismaService) {
    this.logger.info('cron job initialized');
  }

  @Cron('1 9 * * *', { timeZone: 'Asia/Jakarta' })
  async handleCron() {
    await this.prisma.synchronizeEmployeeCache();

    this.logger.info('cron job is start');
    const currentDate = getDate(getDateString(new Date()));

    try {
      const absentEmployees = await this.prisma.employeeCache.findMany({
        where: {
          attendances: {
            none: { date: currentDate },
          },
        },
      });

      const absentAttendanceData: Prisma.AttendanceCreateManyInput[] =
        absentEmployees.map((employee) => ({
          nik: employee.nik,
          date: currentDate,
          status: 'absent',
        }));

      await this.prisma.attendance.createMany({
        data: absentAttendanceData,
      });

      this.logger.info(
        `${absentAttendanceData.length} OnSite marked as 'absent' for today.`,
      );
    } catch (error) {
      this.logger.error(error);
    }
  }
}
