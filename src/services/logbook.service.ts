import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  LogbookResBody,
  LogbookReqBody,
  UpdateLogbookReqBody,
} from '../dto/logbook.dto';
import { PrismaActivity } from '../interfaces/logbook.interfaces';
import { getDate, isValidTime } from '../utils/date.utils';
import { BaseService } from './base.service';
import { handleError } from '../utils/common.utils';

@Injectable()
export class LogbookService extends BaseService {
  public async handlePostLogbook(
    data: LogbookReqBody,
  ): Promise<LogbookResBody> {
    const { attendance_id, description, status, start_time, end_time } = data;

    try {
      const attendance = await this.prisma.attendance.findFirst({
        where: { id: attendance_id },
        select: { id: true },
      });

      if (!attendance)
        throw new NotFoundException('data attendance tidak ditemukan');

      if (!isValidTime(start_time))
        throw new BadRequestException(
          'start_time harus waktu yang valid dengan format HH:MM',
        );
      if (!isValidTime(end_time))
        throw new BadRequestException(
          'end_time harus waktu yang valid dengan format HH:MM',
        );

      const logbook: PrismaActivity = await this.prisma.activity.create({
        data: {
          attendance_id,
          description,
          status,
          start_time: getDate(start_time),
          end_time: getDate(end_time),
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
      handleError(error, this.logger);
    }
  }

  public async handleUpdateLogbook(
    activityId: number,
    data: UpdateLogbookReqBody,
  ): Promise<LogbookResBody> {
    try {
      const activity = await this.prisma.activity.findFirst({
        where: { id: activityId },
        select: { id: true },
      });

      if (!activity) throw new NotFoundException('logbook tidak ditemukan');

      const result: PrismaActivity = await this.prisma.activity.update({
        where: { id: activityId },
        data,
        select: {
          id: true,
          description: true,
          status: true,
          start_time: true,
          end_time: true,
        },
      });

      return new LogbookResBody(result);
    } catch (error) {
      handleError(error, this.logger);
    }
  }
}
