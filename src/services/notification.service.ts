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
    const coordinators: any = {};
    const getCoordinator = async (nik: string) => {
      if (!coordinators[nik]) {
        const coordinator = await this.prisma.employeeCache.findUnique({
          where: { nik },
          select: { name: true },
        });
        coordinators[nik] = coordinator.name;
      }

      return coordinators[nik];
    };

    try {
      const employee = await this.prisma.employeeCache.findUnique({
        where: { nik },
        select: { name: true },
      });
      const name = employee?.name;

      if (!name) {
        throw new NotFoundException('Karyawan tidak ditemukan!');
      }

      const notificationBuilder = new NotificationBuilder(nik, name);
      const current = getDate(getDateString(new Date()));

      const attendance = await this.prisma.attendance.findFirst({
        where: { nik, date: current },
        select: {
          id: true,
          status: true,
          overtime: true,
          checkIn: { select: { time: true } },
        },
      });

      if (attendance) {
        const confirmations = await this.prisma.attendanceConfirmation.findMany(
          { where: { attendance_id: attendance.id } },
        );

        for (const confirmation of confirmations) {
          const {
            approved,
            type,
            checked,
            description,
            created_at,
            approvalNik,
            deniedDescription,
            attachment,
          } = confirmation;

          let message =
            `Konfirmasi kehadiran ${this.getConfirmationType(type)} Anda hari ini ` +
            `${this.getApprovalMessage(approved, checked)}` +
            (checked && approvalNik
              ? ` (${await getCoordinator(approvalNik)})`
              : '');

          if (checked && !approved)
            message += ` karena alasan:\n"${deniedDescription}"`;
          message += `\nDeskripsi konfirmasi kehadiran:\n${description}`;

          notificationBuilder
            .setMessage(message)
            .setDateString(getTimeString(created_at))
            .setFile(getFileUrl(attachment, 'confirmation', 'file'))
            .setPriority(2)
            .push();
        }

        notificationBuilder.setPriority(3);

        const late = getLate(attendance?.checkIn?.time);
        if (late) {
          notificationBuilder
            .setMessage(`Anda terlambat ${late} hari ini.`)
            .setDateString(getTimeString(attendance.checkIn.time, true))
            .push();
        } else if (attendance?.status === 'absent') {
          notificationBuilder
            .setMessage('Anda tidak masuk hari ini.')
            .setDateString('09:01')
            .push();
        } else if (attendance?.status === 'permit') {
          notificationBuilder
            .setMessage('Izin Anda hari ini telah disetujui oleh Koordinator.')
            .setDateString(getDateString(current))
            .push();
        }

        if (attendance?.overtime) {
          const {
            approved,
            checked,
            created_at,
            approvalNik,
            deniedDescription,
          } = attendance.overtime;

          let message =
            `Pengajuan lembur Anda hari ini ${this.getApprovalMessage(approved, checked)}` +
            (checked && approvalNik
              ? ` (${await getCoordinator(approvalNik)})`
              : '');
          if (checked && !approved)
            message += ` karena alasan:\n"${deniedDescription}"`;

          notificationBuilder
            .setMessage(message)
            .setDateString(getTimeString(created_at))
            .setPriority(1)
            .push();
        }
      }

      const permits = await this.prisma.permit.findMany({
        where: { nik, start_date: { gte: current } },
        orderBy: [{ start_date: 'desc' }],
      });

      for (const permit of permits) {
        const {
          start_date,
          approved,
          deniedDescription,
          approvalNik,
          duration,
          checked,
        } = permit;

        let message =
          `Pengajuan izin Anda untuk tanggal ${getDateString(start_date)} selama ${duration} hari ${this.getApprovalMessage(approved, checked)}` +
          (checked && approvalNik
            ? ` (${await getCoordinator(approvalNik)})`
            : '');
        if (checked && !approved)
          message += ` karena alasan:\n"${deniedDescription}"`;

        notificationBuilder
          .setMessage(message)
          .setDateString(getDateString(permit.created_at))
          .setFile(getFileUrl(permit.permission_letter, 'permit', 'file'))
          .setPriority(1)
          .push();
      }

      return notificationBuilder.getNotifications();
    } catch (error) {
      handleError(error, this.logger);
    }
  }

  public async handleCoordinatorNotification(
    nik: string,
  ): Promise<NotificationResBody[]> {
    const notificationBuilder = new NotificationBuilder();
    const current = getDate(getDateString(new Date()));

    try {
      const employee = await this.prisma.employeeCache.findUnique({
        where: { nik },
      });

      const attendances = await this.prisma.attendance.findMany({
        where: {
          date: current,
          employee: { area: employee.area },
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
            .setDate(attendance.checkIn.time)
            .setDateString(getTimeString(attendance.checkIn.time, true))
            .push();
        else if (attendance?.status === 'absent')
          notificationBuilder
            .setMessage('Tidak masuk hari ini.')
            .setDate(new Date('1970-01-01T09:01:00.000Z'))
            .setDateString('09:01')
            .push();

        if (attendance?.overtime?.checked === false)
          notificationBuilder
            .setMessage('Mengajukan lembur hari ini.')
            .setDate(attendance.overtime.created_at)
            .setDateString(getTimeString(attendance.overtime.created_at))
            .setPriority(1)
            .setActionEndpoint(`/monitoring/overtime/${attendance.overtime.id}`)
            .push();
      });

      notificationBuilder.setPriority(2);
      const confirmations = await this.prisma.attendanceConfirmation.findMany({
        where: {
          attendance: { date: current, employee: { area: employee.area } },
          checked: false,
        },
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
          .setDate(confirmation.created_at)
          .setDateString(getTimeString(confirmation.created_at))
          .setFile(getFileUrl(confirmation.attachment, 'confirmation', 'file'))
          .setMessage(message)
          .setActionEndpoint(`/monitoring/confirmation/${confirmation.id}`)
          .push();
      }

      notificationBuilder.setPriority(3);
      const permits = await this.prisma.permit.findMany({
        where: {
          start_date: { gt: current },
          checked: false,
          employee: { area: employee.area },
        },
        include: {
          employee: { select: { nik: true, name: true } },
        },
      });

      permits.forEach((permit) => {
        notificationBuilder
          .setNik(permit.employee.nik)
          .setName(permit.employee.name)
          .setDate(permit.created_at)
          .setDateString(getDateString(permit.created_at))
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

  private getApprovalMessage(approved: boolean, checked: boolean): string {
    const approvedMessage = (approved ? 'telah' : 'TIDAK') + ' DISETUJUI';
    const message = !checked ? 'belum diperiksa' : approvedMessage;
    return `${message} oleh Koordinator`;
  }

  private getConfirmationType(type: ConfirmationType): string {
    return type.replace('_', ' ');
  }
}
