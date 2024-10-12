import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { getDate, getDateString, getTimeString } from '../utils/date.utils';
import { LoggerUtil } from '../utils/logger.utils';
import { getFileUrl, getLate, handleError } from '../utils/common.utils';
import { NotificationBuilder } from '../builders/notification.builder';
import { NotificationResBody } from '../dto/notification.dto';

@Injectable()
export class NotificationService {
  private readonly logger = new LoggerUtil('NotificationService');

  public constructor(private readonly prisma: PrismaService) {}

  public async handleOnSiteNotification(
    nik: string,
  ): Promise<NotificationResBody[]> {
    const name = await this.getEmployeeName(nik);
    const notificationBuilder = new NotificationBuilder(nik, name);
    const current = getDate(getDateString(new Date()));

    try {
      const attendance = await this.prisma.attendance.findFirst({
        where: { nik, date: current },
        select: {
          status: true,
          overtime: { select: { approved: true, created_at: true } },
          checkIn: { select: { time: true } },
        },
      });

      const late = getLate(attendance?.checkIn?.time);
      if (late) {
        notificationBuilder
          .setMessage(`Anda terlambat ${late} hari ini.`)
          .setDate(getTimeString(attendance.checkIn.time, true))
          .push();
      } else if (attendance?.status === 'absent') {
        notificationBuilder
          .setMessage('Anda tidak masuk hari ini.')
          .setDate('09:01')
          .push();
      } else if (attendance?.status === 'permit') {
        notificationBuilder
          .setMessage('Izin Anda hari ini telah disetujui oleh Koordinator.')
          .setDate(getDateString(current))
          .push();
      }

      if (attendance?.overtime) {
        notificationBuilder
          .setMessage(
            `Pengajuan lembur Anda hari ini ${this.getApprovalMessage(attendance.overtime.approved)}.`,
          )
          .setDate(getTimeString(attendance.overtime.created_at))
          .setLevel('overtime')
          .push();
      }

      const permit = await this.prisma.permit.findFirst({
        where: { nik, start_date: { gt: current } },
        select: {
          start_date: true,
          duration: true,
          approved: true,
          created_at: true,
          permission_letter: true,
        },
      });

      if (permit) {
        notificationBuilder
          .setMessage(
            `Pengajuan izin Anda untuk tanggal ${getDateString(permit.start_date)} selama ${permit.duration} hari ${this.getApprovalMessage(permit.approved)}.`,
          )
          .setDate(getDateString(permit.created_at))
          .setFile(getFileUrl(permit.permission_letter, 'permit', 'file'))
          .setLevel('permit')
          .push();
      }
    } catch (error) {
      handleError(error, this.logger);
    }

    return notificationBuilder.getNotifications();
  }

  public async handleCoordinatorNotification(): Promise<NotificationResBody[]> {
    const notificationBuilder = new NotificationBuilder();
    const current = getDate(getDateString(new Date()));

    try {
      const attendances = await this.prisma.attendance.findMany({
        where: {
          date: current,
          OR: [
            { status: 'absent' },
            { status: 'presence' },
            { overtime: { checked: false } },
          ],
        },
        select: {
          status: true,
          employee: { select: { nik: true, name: true } },
          checkIn: { select: { time: true } },
          overtime: true,
        },
      });

      attendances.forEach((attendance) => {
        notificationBuilder
          .setNik(attendance.employee.nik)
          .setName(attendance.employee.name);

        const late = getLate(attendance?.checkIn?.time);
        if (late)
          notificationBuilder
            .setMessage(`Terlambat ${late} hari ini.`)
            .setDate(getTimeString(attendance.checkIn.time, true))
            .setLevel('attendance')
            .push();
        else if (attendance?.status === 'absent')
          notificationBuilder
            .setMessage('Tidak masuk hari ini.')
            .setDate('09:01')
            .setLevel('attendance')
            .push();

        if (attendance?.overtime?.checked === false)
          notificationBuilder
            .setMessage('Mengajukan lembur hari ini.')
            .setDate(getTimeString(attendance.overtime.created_at))
            .setLevel('overtime')
            .setActionEndpoint(`/monitoring/overtime/${attendance.overtime.id}`)
            .push();
      });

      notificationBuilder.setLevel('permit');
      const permits = await this.prisma.permit.findMany({
        where: { start_date: { gt: current }, checked: false },
        include: {
          employee: { select: { nik: true, name: true } },
        },
      });

      permits.forEach((permit) => {
        notificationBuilder
          .setNik(permit.employee.nik)
          .setName(permit.employee.name)
          .setDate(getDateString(permit.created_at))
          .setFile(getFileUrl(permit.permission_letter, 'permit', 'file'))
          .setMessage(
            `Mengajukan izin pada ${getDateString(permit.start_date)} selama ${permit.duration} hari dengan alasan "${permit.reason}".`,
          )
          .setActionEndpoint(`/permit/${permit.id}`)
          .push();
      });
    } catch (error) {
      handleError(error, this.logger);
    }

    return notificationBuilder.getNotifications();
  }

  private async getEmployeeName(nik: string) {
    const employee = await this.prisma.employeeCache.findUnique({
      where: { nik },
      select: { name: true },
    });
    return employee.name;
  }

  private getApprovalMessage(approved: boolean) {
    return `${approved ? 'telah' : 'belum'} disetujui oleh Koordinator`;
  }
}
