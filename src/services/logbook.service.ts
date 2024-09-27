import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { getPrismaClient } from '../utils/prisma.utils';
import { LogbookResBody, LogbookReqBody } from '../dto/logbook.dto';
import { DateUtils } from '../utils/date.utils';
import { PrismaActivity } from '../interfaces/logbook.interfaces';
import { logFormat, logger } from '../utils/logger.utils';

@Injectable()
export class LogbookService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = getPrismaClient();
  }

  async handlePostLogbook(data: LogbookReqBody): Promise<LogbookResBody> {
    const { attendance_id, description, status, start_time, end_time } = data;

    let attendance: { id: number };
    try {
      attendance = await this.prisma.attendance.findFirst({
        where: { id: attendance_id },
        select: { id: true },
      });
    } catch (error) {
      logger.error(logFormat(error));
      throw new InternalServerErrorException();
    }

    if (!attendance) {
      throw new NotFoundException('data attendance tidak ditemukan');
    }

    if (!DateUtils.isValidTime(start_time)) {
      throw new BadRequestException(
        'start_time harus waktu yang valid dengan format HH:MM',
      );
    }

    if (!DateUtils.isValidTime(end_time)) {
      throw new BadRequestException(
        'end_time harus waktu yang valid dengan format HH:MM',
      );
    }

    try {
      const logbook: PrismaActivity = await this.prisma.activity.create({
        data: {
          attendance_id,
          description,
          status,
          start_time: DateUtils.setDate(start_time).getTimeIso(),
          end_time: DateUtils.setDate(end_time).getTimeIso(),
        },
        select: {
          id: true,
          description: true,
          status: true,
          start_time: true,
          end_time: true,
        },
      });

      return new LogbookResBody(logbook);
    } catch (error) {
      logger.error(logFormat(error));
      throw new InternalServerErrorException();
    }
  }

  async handleGetLogbook() {
    throw new NotImplementedException();
  }

  async handleUpdateLogbook() {
    throw new NotImplementedException();
  }
}
