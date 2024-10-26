import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PermitPatchResBody,
  PermitPostReqBody,
  PermitResBody,
} from '../dto/permit.dto';
import { Reason } from '@prisma/client';
import { getEmployee } from '../utils/api.utils';
import { getDate, getDateString } from '../utils/date.utils';
import { uploadFile } from '../utils/upload.utils';
import { BaseService } from './base.service';
import { handleError } from '../utils/common.utils';

@Injectable()
export class PermitService extends BaseService {
  public async handlePermit(data: PermitPostReqBody): Promise<PermitResBody> {
    const { nik, reason, start_date, duration, permission_letter } = data;
    const startDate = getDate(start_date);

    this.validatePermitDate(startDate, duration);

    const employee = await getEmployee(nik);
    if (!employee) throw new NotFoundException('karyawan tidak ditemukan');

    try {
      const existingPermit = await this.prisma.permit.findFirst({
        where: { nik, checked: false },
        select: { id: true },
      });

      if (existingPermit)
        throw new ConflictException(
          'anda masih memiliki izin yang belum disetujui',
        );

      const currentDate = new Date(start_date);
      for (let i = 0; i < duration; i++) {
        if (currentDate.getDay() === 0) {
          currentDate.setDate(currentDate.getDate() + 1);
        }

        const attendance = await this.prisma.attendance.findFirst({
          where: {
            nik,
            date: currentDate,
          },
        });

        if (attendance)
          throw new ConflictException(
            `karyawan telah melakukan check in atau memiliki izin yang telah disetujui pada ${getDateString(currentDate)}`,
          );

        currentDate.setDate(currentDate.getDate() + 1);
      }

      const filename = await uploadFile(permission_letter, nik, 'permit');
      const result = await this.prisma.permit.create({
        data: {
          nik,
          reason: reason as Reason,
          start_date: startDate,
          duration,
          permission_letter: filename,
          approved: false,
          checked: false,
        },
      });

      return new PermitResBody(result);
    } catch (error) {
      handleError(error, this.logger);
    }
  }

  public async handleUpdatePermit(
    id: number,
    approved: boolean,
  ): Promise<PermitPatchResBody> {
    try {
      const existingPermit = await this.prisma.permit.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!existingPermit)
        throw new NotFoundException('data permit tidak ditemukan');

      const permit = await this.prisma.permit.update({
        where: { id },
        data: { approved, checked: true },
      });

      if (approved) {
        const currentDate = permit.start_date;

        for (let i = 0; i < permit.duration; i++) {
          if (currentDate.getDay() === 0) {
            currentDate.setDate(currentDate.getDate() + 1);
          }

          const attendance = await this.prisma.attendance.findFirst({
            where: { nik: permit.nik, date: currentDate },
            select: { id: true },
          });

          if (attendance) {
            await this.prisma.attendance.update({
              where: { id: attendance.id },
              data: { permit_id: permit.id, status: 'permit' },
              select: { id: true },
            });
          } else {
            await this.prisma.attendance.create({
              data: {
                nik: permit.nik,
                permit_id: permit.id,
                date: currentDate,
                status: 'permit',
              },
              select: { id: true },
            });
          }

          currentDate.setDate(currentDate.getDate() + 1);
        }
      }

      return {
        id: permit.id,
        approved,
      };
    } catch (error) {
      handleError(error, this.logger);
    }
  }

  private validatePermitDate(startDate: Date, duration: number) {
    const today = getDate(getDateString(new Date()));

    if (startDate.getTime() < today.getTime())
      throw new ConflictException(
        `tidak dapat melakukan permit untuk ${getDateString(startDate)}`,
      );

    if (startDate.getTime() === today.getTime() && duration !== 1)
      throw new ConflictException(
        'hanya dapat mengajukan izin 1 hari untuk pengajuan izin di hari ini',
      );
  }
}
