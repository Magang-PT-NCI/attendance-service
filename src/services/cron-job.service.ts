import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from './prisma.service';
import { getDate, getDateString } from '../utils/date.utils';
import { Prisma } from '@prisma/client';
import { BaseService } from './base.service';

@Injectable()
export class CronJobService extends BaseService {
  public constructor(prisma: PrismaService) {
    super(prisma);
    this.logger.info('cron job initialized');
  }

  @Cron('1 9 * * *', { timeZone: 'Asia/Jakarta' })
  public async handleCron() {
    this.logger.info('cron job is started');

    try {
      await this.prisma.synchronizeEmployeeCache();
    } catch (error) {
      this.logger.info('synchronize employee cache failed');
      this.logger.error(error);
    }

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

      const current = getDate(getDateString(new Date()));

      await this.prisma.permit.deleteMany({
        where: { start_date: { lt: current }, checked: false },
      });

      await this.prisma.overtime.deleteMany({
        where: { created_at: { lt: current }, checked: false },
      });

      await this.prisma.attendanceConfirmation.deleteMany({
        where: { created_at: { lt: current }, checked: false },
      });
    } catch (error) {
      this.logger.error(error);
    }
  }
}
