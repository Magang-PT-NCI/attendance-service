import { Injectable, NotFoundException } from '@nestjs/common';
import {
  PatchResBody,
  DashboardResBody,
  DashboardWeeklySummary,
  ReportResBody,
} from '../dto/monitoring.dto';
import { DaySummary } from '../interfaces/monitoring.interfaces';
import { getDate, getDateString } from '../utils/date.utils';
import { handleError } from '../utils/common.utils';
import { AttendanceStatus } from '@prisma/client';
import { BaseService } from './base.service';
import { Attendance } from '../interfaces/attendance.interfaces';

@Injectable()
export class MonitoringService extends BaseService {
  private static DAYS = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];

  public async handleDashboard(): Promise<DashboardResBody> {
    const today = getDate(getDateString(new Date()));

    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(today);
    monday.setDate(today.getDate() + diffToMonday);

    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);

    try {
      const attendances: Attendance[] = await this.prisma.attendance.findMany({
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

      const todayData: Attendance[] = attendances.filter(
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
    } catch (error) {
      handleError(error, this.logger);
    }
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

    const include = {
      employee: true,
      checkIn: true,
      checkOut: true,
    };

    try {
      const attendances = await this.prisma.attendance.findMany({
        where: {
          date: dateCondition,
          OR: [nikCondition, nameCondition],
        },
        include,
        orderBy: [{ date: 'desc' }, { employee: { name: 'asc' } }],
      });

      return ReportResBody.getReport(attendances);
    } catch (error) {
      handleError(error, this.logger);
    }
  }

  public async handleUpdateOvertime(
    id: number,
    approved: boolean,
  ): Promise<PatchResBody> {
    try {
      const existingOvertime = await this.prisma.overtime.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!existingOvertime)
        throw new NotFoundException('data lembur tidak ditemukan');

      return this.prisma.overtime.update({
        where: { id },
        data: { approved, checked: true },
        select: { id: true, approved: true },
      });
    } catch (error) {
      handleError(error, this.logger);
    }
  }

  public async handleUpdateAttendanceConfirmation(
    id: number,
    approved: boolean,
  ): Promise<PatchResBody> {
    try {
      const confirmation = await this.prisma.attendanceConfirmation.findUnique({
        where: { id },
        include: {
          attendance: {
            select: {
              nik: true,
              check_in_id: true,
              check_out_id: true,
            },
          },
        },
      });

      if (!confirmation)
        throw new NotFoundException(
          'data konfirmasi kehadiran tidak ditemukan',
        );

      if (!approved)
        return this.prisma.attendanceConfirmation.update({
          where: { id },
          data: { approved, checked: true },
          select: { id: true, approved: true },
        });

      return this.prisma.$transaction(async (prisma) => {
        const attendanceUpdateData = {
          status: (confirmation.type === 'permit'
            ? 'permit'
            : 'presence') as AttendanceStatus,
          check_in_id: undefined,
          check_out_id: undefined,
          permit_id: undefined,
        };

        const handleCheck = async (type: 'in' | 'out') => {
          const time = type === 'in' ? '07:00' : '15:00';
          if (confirmation.attendance[`check_${type}_id`]) {
            await prisma.check.update({
              where: { id: confirmation.attendance[`check_${type}_id`] },
              data: { time: getDate(time) },
            });
          } else {
            const check = await prisma.check.create({
              data: {
                type: type,
                time: getDate(time),
              },
              select: { id: true },
            });
            attendanceUpdateData[`check_${type}_id`] = check.id;
          }
        };

        switch (confirmation.type) {
          case 'permit': {
            const permit = await prisma.permit.create({
              data: {
                nik: confirmation.attendance.nik,
                reason: confirmation.reason,
                start_date: getDate(getDateString(confirmation.created_at)),
                duration: 1,
                permission_letter: confirmation.attachment,
                approved: true,
                checked: true,
              },
              select: { id: true },
            });
            attendanceUpdateData.permit_id = permit.id;
            break;
          }
          case 'check_in':
            await handleCheck('in');
            break;
          case 'check_out':
            await handleCheck('out');
            break;
        }

        await prisma.attendance.update({
          where: { id: confirmation.attendance_id },
          data: attendanceUpdateData,
        });

        return prisma.attendanceConfirmation.update({
          where: { id },
          data: { approved, checked: true },
          select: { id: true, approved: true },
        });
      });
    } catch (error) {
      handleError(error, this.logger);
    }
  }

  private getSummaryCount(attendances: Attendance[]): DaySummary {
    const summary: DaySummary = { presence: 0, permit: 0, absent: 0 };
    attendances.forEach(({ status }) => summary[status]++);
    return summary;
  }

  private getDaySummary(attendances: Attendance[], day: number): DaySummary {
    const dayData = attendances.filter(
      (attendance) => attendance.date.getDay() === day,
    );
    return this.getSummaryCount(dayData);
  }
}
