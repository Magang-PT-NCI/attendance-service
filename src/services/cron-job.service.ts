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
    try {
      await this.prisma.synchronizeEmployeeCache();
    } catch (error) {
      this.logger.info('synchronize employee cache failed');
      this.logger.error(error);
    }

    this.logger.info('cron job is started');
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
