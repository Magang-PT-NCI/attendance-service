import { Injectable, NotFoundException } from '@nestjs/common';
import { getDate, getDateString, getTimeString } from '../utils/date.utils';
import { getFileUrl, getLate, handleError } from '../utils/common.utils';
import { NotificationBuilder } from '../builders/notification.builder';
import { NotificationResBody } from '../dto/notification.dto';
import { ConfirmationType } from '@prisma/client';
import { BaseService } from './base.service';

@Injectable()
export class NotificationService extends BaseService {
  public async handleOnSiteNotification(
    nik: string,
  ): Promise<NotificationResBody[]> {
    const name = await this.getEmployeeName(nik);

    if (!name) {
      throw new NotFoundException('Karyawan tidak ditemukan!');
    }

    const notificationBuilder = new NotificationBuilder(nik, name);
    const current = getDate(getDateString(new Date()));

    try {
      const attendance = await this.prisma.attendance.findFirst({
        where: { nik, date: current },
        select: {
          id: true,
          status: true,
          overtime: {
            select: { approved: true, checked: true, created_at: true },
          },
          checkIn: { select: { time: true } },
        },
      });

      if (attendance) {
        const confirmations = await this.prisma.attendanceConfirmation.findMany(
          {
            where: { attendance_id: attendance.id },
            select: {
              approved: true,
              checked: true,
              created_at: true,
              attachment: true,
              type: true,
              description: true,
            },
          },
        );
        confirmations.forEach((confirmation) => {
          const message =
            `Konfirmasi kehadiran ${this.getConfirmationType(confirmation.type)} Anda hari ini ` +
            `${this.getApprovalMessage(confirmation.approved, confirmation.checked)}.` +
            `\nDeskripsi konfirmasi kehadiran:\n${confirmation.description}`;

          notificationBuilder
            .setMessage(message)
            .setDate(getTimeString(confirmation.created_at))
            .setFile(
              getFileUrl(confirmation.attachment, 'confirmation', 'file'),
            )
            .setPriority(2)
            .push();
        });

        notificationBuilder.setPriority(3);

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
              `Pengajuan lembur Anda hari ini ${this.getApprovalMessage(attendance.overtime.approved, attendance.overtime.checked)}.`,
            )
            .setDate(getTimeString(attendance.overtime.created_at))
            .setPriority(1)
            .push();
        }
      }

      const permit = await this.prisma.permit.findFirst({
        where: { nik, start_date: { gte: current } },
        select: {
          start_date: true,
          duration: true,
          approved: true,
          checked: true,
          created_at: true,
          permission_letter: true,
        },
      });

      if (permit) {
        notificationBuilder
          .setMessage(
            `Pengajuan izin Anda untuk tanggal ${getDateString(permit.start_date)} selama ${permit.duration} hari ${this.getApprovalMessage(permit.approved, permit.checked)}.`,
          )
          .setDate(getDateString(permit.created_at))
          .setFile(getFileUrl(permit.permission_letter, 'permit', 'file'))
          .setPriority(1)
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
          .setName(attendance.employee.name)
          .setPriority(4);

        const late = getLate(attendance?.checkIn?.time);
        if (late)
          notificationBuilder
            .setMessage(`Terlambat ${late} hari ini.`)
            .setDate(getTimeString(attendance.checkIn.time, true))
            .push();
        else if (attendance?.status === 'absent')
          notificationBuilder
            .setMessage('Tidak masuk hari ini.')
            .setDate('09:01')
            .push();

        if (attendance?.overtime?.checked === false)
          notificationBuilder
            .setMessage('Mengajukan lembur hari ini.')
            .setDate(getTimeString(attendance.overtime.created_at))
            .setPriority(1)
            .setActionEndpoint(`/monitoring/overtime/${attendance.overtime.id}`)
            .push();
      });

      notificationBuilder.setPriority(2);
      const confirmations = await this.prisma.attendanceConfirmation.findMany({
        where: { attendance: { date: current }, checked: false },
        include: {
          attendance: {
            select: {
              employee: { select: { nik: true, name: true } },
              status: true,
              check_out_id: true,
              checkIn: { select: { time: true } },
            },
          },
        },
      });

      for (const confirmation of confirmations) {
        const attendance = confirmation.attendance;

        let initialStatus = 'hadir';
        if (attendance.status === 'absent') initialStatus = 'tidak hadir';
        else if (getLate(attendance.checkIn.time)) initialStatus = 'terlambat';
        else if (!attendance.check_out_id) initialStatus = 'tidak check out';
        else if (attendance.status === 'permit') initialStatus = 'izin';

        const type = this.getConfirmationType(confirmation.type);
        let message = `Melakukan konfirmasi kehadiran ${type} dengan status awal '${initialStatus}'.`;
        message += `\n\nDeskripsi Konfirmasi Kehadiran:\n"${confirmation.description}"`;

        if (confirmation.type === 'permit') {
          message += `\n\nJika disetujui, data izin untuk OnSite dengan alasan '${confirmation.reason}' akan dibuat untuk hari ini.`;
        } else {
          const initialTime =
            confirmation.type === 'check_in' && attendance.checkIn
              ? getTimeString(attendance.checkIn.time, true)
              : null;
          const actualTime =
            confirmation.type === 'check_in' ? '07:00' : '15:00';

          message += initialTime
            ? `\n\nJika disetujui, waktu ${type} OnSite akan diubah dari ${initialTime} menjadi ${actualTime}.`
            : `\n\nJika disetujui, waktu ${type} OnSite akan diubah menjadi ${actualTime}.`;
        }

        notificationBuilder
          .setNik(confirmation.attendance.employee.nik)
          .setName(confirmation.attendance.employee.name)
          .setDate(getTimeString(confirmation.created_at))
          .setFile(getFileUrl(confirmation.attachment, 'confirmation', 'file'))
          .setMessage(message)
          .setActionEndpoint(`/monitoring/confirmation/${confirmation.id}`)
          .push();
      }

      notificationBuilder.setPriority(3);
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

  private async getEmployeeName(nik: string): Promise<string> {
    try {
      const employee = await this.prisma.employeeCache.findUnique({
        where: { nik },
        select: { name: true },
      });
      return employee?.name;
    } catch (error) {
      handleError(error, this.logger);
    }
  }

  private getApprovalMessage(approved: boolean, checked: boolean): string {
    const approvedMessage = approved ? 'telah' : 'tidak';
    const message = !checked ? 'belum' : approvedMessage;
    return `${message} disetujui oleh Koordinator`;
  }

  private getConfirmationType(type: ConfirmationType): string {
    return type.replace('_', ' ');
  }
}
