import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  LogbookResBody,
  LogbookReqBody,
  UpdateLogbookReqBody,
} from '../dto/logbook.dto';
import { getDate, isValidTime } from '../utils/date.utils';
import { BaseService } from './base.service';
import { handleError } from '../utils/common.utils';
import { Activity } from '@prisma/client';

@Injectable()
export class LogbookService extends BaseService {
  public async handlePostLogbook(
    data: LogbookReqBody,
  ): Promise<LogbookResBody> {
    const { attendance_id, description, status, start_time, end_time } = data;

    try {
      const attendance = await this.prisma.attendance.findFirst({
        where: { id: attendance_id },
        select: {
          id: true,
          checkIn: { select: { time: true } },
          checkOut: { select: { time: true } },
        },
      });

      if (!attendance)
        throw new NotFoundException('data attendance tidak ditemukan');

      if (!attendance.checkIn)
        throw new ConflictException('anda belum melakukan check in');

      if (!isValidTime(start_time))
        throw new BadRequestException(
          'start_time harus waktu yang valid dengan format HH:MM',
        );
      if (!isValidTime(end_time))
        throw new BadRequestException(
          'end_time harus waktu yang valid dengan format HH:MM',
        );

      const startTime = getDate(start_time);
      const endTime = getDate(end_time);

      if (startTime.getTime() < attendance.checkIn.time.getTime())
        throw new ConflictException(
          'start time tidak bisa kurang dari waktu check in',
        );

      if (endTime.getTime() < startTime.getTime())
        throw new ConflictException(
          'end time tidak boleh kurang dari start time',
        );

      const checkOutTime = attendance.checkOut?.time;
      if (checkOutTime && endTime.getTime() > checkOutTime.getTime())
        throw new ConflictException(
          'end time tidak boleh melebihi waktu check out',
        );

      const logbook: Activity = await this.prisma.activity.create({
        data: {
          attendance_id,
          description,
          status,
          start_time: startTime,
          end_time: endTime,
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

      const result: Activity = await this.prisma.activity.update({
        where: { id: activityId },
        data,
      });

      return new LogbookResBody(result);
    } catch (error) {
      handleError(error, this.logger);
    }
  }
}
