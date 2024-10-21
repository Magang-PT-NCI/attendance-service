import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PermitPostReqBody, PermitResBody } from '../dto/permit.dto';
import { Reason } from '@prisma/client';
import { getEmployee } from '../utils/api.utils';
import { getDate, getDateString } from '../utils/date.utils';
import { uploadFile } from '../utils/upload.utils';
import { BaseService } from './base.service';

@Injectable()
export class PermitService extends BaseService {
  public async handlePermit(data: PermitPostReqBody): Promise<PermitResBody> {
    const { nik, reason, start_date, duration, permission_letter } = data;
    const startDate = getDate(getDateString(new Date(start_date)));

    const employee = await getEmployee(nik);
    if (!employee) {
      throw new NotFoundException('karyawan tidak ditemukan');
    }

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

      if (attendance) {
        throw new ConflictException(
          `karyawan telah melakukan check in atau memiliki izin yang telah disetujui pada ${getDateString(currentDate)}`,
        );
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    const filename = await uploadFile(permission_letter, nik, 'permit');
    try {
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
      this.logger.error(error);
      throw new InternalServerErrorException();
    }
  }

  public async handleUpdatePermit(
    id: number,
    approved: boolean,
  ): Promise<PermitResBody> {
    const existingPermit = await this.prisma.permit.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingPermit) {
      throw new NotFoundException('data permit tidak ditemukan');
    }

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

        await this.prisma.attendance.create({
          data: {
            nik: permit.nik,
            permit_id: permit.id,
            date: currentDate,
            status: 'permit',
          },
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    return new PermitResBody(permit);
  }
}
