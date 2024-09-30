import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { PermitPostReqBody, PermitResBody } from '../dto/permit.dto';
import { ApiUtils } from '../utils/api.utils';
import { DateUtils } from '../utils/date.utils';
import { PrismaClient, Reason } from '@prisma/client';
import { getPrismaClient } from 'src/utils/prisma.utils';
import { FILE_DESTINATION } from '../config/app.config';
import { UploadUtil } from '../utils/upload.utils';
import { logFormat, logger } from '../utils/logger.utils';

@Injectable()
export class PermitService {
  private readonly prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }
  async handlePermit(data: PermitPostReqBody) {
    const { nik, reason, start_date, duration, permission_letter } = data;
    const dateUtils = DateUtils.setDate(start_date);
    const startDate = dateUtils.getDate();

    const employee = await ApiUtils.getEmployee(nik);
    if (!employee) {
      throw new NotFoundException('karyawan tidak ditemukan');
    }

    const currentDate = new Date(dateUtils.getDate());

    for (let i = 0; i < duration; i++) {
      if (currentDate.getDay() === 0) {
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const attendance = await this.prisma.attendance.findFirst({
        where: {
          nik,
          date: DateUtils.setDate(currentDate).getDateIso(),
        },
      });

      if (attendance) {
        throw new ConflictException(
          'karyawan telah melakukan check in atau memiliki izin yang telah disetujui',
        );
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    let filename: string = '';

    if (FILE_DESTINATION === 'cloud') {
      filename = await UploadUtil.uploadToDrive(
        permission_letter,
        nik,
        'permit',
        dateUtils,
      );

      if (!filename) {
        throw new InternalServerErrorException();
      }
    } else {
      filename = UploadUtil.uploadToLocal(
        permission_letter,
        nik,
        'permit',
        dateUtils,
      );
    }

    try {
      const result = await this.prisma.permit.create({
        data: {
          reason: reason as Reason,
          start_date: startDate,
          duration,
          permission_letter: filename,
          approved: false,
        },
      });

      return new PermitResBody(result);
    } catch (error) {
      logger.error(logFormat(error));
      throw new InternalServerErrorException();
    }

    // sendNotification({
    //   nik: employee.nik,
    //   name: employee.name,
    //   time: dateUtc,
    //   message:
    //     `Mengajukan izin selama ${duration} hari`,
    //   action: {
    //     data: result.permit,
    //     need: true,
    //     type: 'permit',
    //   },
    // });
  }

  async handleUpdatePermit() {
    throw new NotImplementedException();
  }
}
