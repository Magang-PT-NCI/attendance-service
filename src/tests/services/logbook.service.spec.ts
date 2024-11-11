import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Activity, Attendance } from '@prisma/client';
import { LogbookService } from '../../services/logbook.service';
import {
  LogbookReqBody,
  LogbookResBody,
  UpdateLogbookReqBody,
} from '../../dto/logbook.dto';
import { PrismaService } from '../../services/prisma.service';
import { LoggerUtil } from '../../utils/logger.utils';
import * as DateUtils from '../../utils/date.utils';
import * as CommonUtils from '../../utils/common.utils';

describe('logbook service test', () => {
  let service: LogbookService;
  let prisma: PrismaService;
  let isValidTime: jest.Mock;
  let handleError: jest.Mock;

  beforeAll(async () => {
    prisma = new PrismaService();
    service = new LogbookService(prisma);

    isValidTime = jest.spyOn(DateUtils, 'isValidTime') as jest.Mock;
    handleError = jest.spyOn(
      CommonUtils,
      'handleError',
    ) as unknown as jest.Mock;
  });

  describe('handlePostLogbook test', () => {
    it('should create a logbook entry successfully', async () => {
      const data: LogbookReqBody = {
        attendance_id: 1,
        description: 'Task description',
        status: 'progress',
        start_time: '09:00',
        end_time: '10:00',
      };

      jest
        .spyOn(prisma.attendance, 'findFirst')
        .mockResolvedValue({ id: 1 } as Attendance);

      jest.spyOn(prisma.activity, 'create').mockResolvedValue({
        id: 1,
        description: 'Task description',
        status: 'progress',
        start_time: new Date(),
        end_time: new Date(),
      } as Activity);

      const result = await service.handlePostLogbook(data);

      expect(result).toEqual(expect.any(LogbookResBody));
      expect(prisma.attendance.findFirst).toHaveBeenCalledWith({
        where: { id: data.attendance_id },
        select: { id: true },
      });
      expect(isValidTime).toHaveBeenCalledWith(data.start_time);
      expect(isValidTime).toHaveBeenCalledWith(data.end_time);
      expect(prisma.activity.create).toHaveBeenCalledWith({
        data: {
          attendance_id: data.attendance_id,
          description: data.description,
          status: data.status,
          start_time: DateUtils.getDate(data.start_time),
          end_time: DateUtils.getDate(data.end_time),
        },
      });
    });

    it('should throw NotFoundException if attendance not found', async () => {
      jest.spyOn(prisma.attendance, 'findFirst').mockResolvedValue(null);

      await expect(
        service.handlePostLogbook({} as LogbookReqBody),
      ).rejects.toThrow(
        new NotFoundException('data attendance tidak ditemukan'),
      );
    });

    it('should throw BadRequestException if time is invalid', async () => {
      const data: LogbookReqBody = {
        attendance_id: 1,
        description: 'Task description',
        status: 'progress',
        start_time: 'invalid',
        end_time: '10:00',
      };

      jest
        .spyOn(prisma.attendance, 'findFirst')
        .mockResolvedValue({ id: 1 } as Attendance);

      await expect(service.handlePostLogbook(data)).rejects.toThrow(
        new BadRequestException(
          'start_time harus waktu yang valid dengan format HH:MM',
        ),
      );

      (data as any).start_time = '09:00';
      (data as any).end_time = 'invalid';

      await expect(service.handlePostLogbook(data)).rejects.toThrow(
        new BadRequestException(
          'end_time harus waktu yang valid dengan format HH:MM',
        ),
      );
    });

    it('should handle prisma error', async () => {
      const error = new Error('Database error');
      jest.spyOn(prisma.attendance, 'findFirst').mockRejectedValue(error);

      await expect(
        service.handlePostLogbook({} as LogbookReqBody),
      ).rejects.toThrow(new InternalServerErrorException());
      expect(handleError).toHaveBeenCalledWith(error, expect.any(LoggerUtil));

      jest
        .spyOn(prisma.attendance, 'findFirst')
        .mockResolvedValue({ id: 1 } as Attendance);
      jest.spyOn(DateUtils, 'isValidTime').mockReturnValue(true);
      jest.spyOn(prisma.activity, 'create').mockRejectedValue(error);

      await expect(
        service.handlePostLogbook({} as LogbookReqBody),
      ).rejects.toThrow(new InternalServerErrorException());
      expect(handleError).toHaveBeenCalledWith(error, expect.any(LoggerUtil));
    });
  });

  describe('handleUpdateLogbook unit test', () => {
    it('should update a logbook entry successfully', async () => {
      const activityId = 1;
      const data: UpdateLogbookReqBody = {
        description: 'Updated description',
        status: 'done',
      };

      jest.spyOn(prisma.activity, 'findFirst').mockResolvedValue({
        id: activityId,
      } as Activity);

      jest.spyOn(prisma.activity, 'update').mockResolvedValue({
        id: activityId,
        description: 'Updated description',
        status: 'done',
        start_time: new Date(),
        end_time: new Date(),
      } as Activity);

      const result = await service.handleUpdateLogbook(activityId, data);

      expect(result).toEqual(expect.any(LogbookResBody));
      expect(prisma.activity.findFirst).toHaveBeenCalledWith({
        where: { id: activityId },
        select: { id: true },
      });
      expect(prisma.activity.update).toHaveBeenCalledWith({
        where: { id: activityId },
        data,
      });
    });

    it('should throw NotFoundException if logbook activity not found', async () => {
      jest.spyOn(prisma.activity, 'findFirst').mockResolvedValue(null);

      await expect(
        service.handleUpdateLogbook(1, {} as UpdateLogbookReqBody),
      ).rejects.toThrow(new NotFoundException('logbook tidak ditemukan'));
    });

    it('should handle prisma error', async () => {
      const error = new Error('Database error');

      jest.spyOn(prisma.activity, 'findFirst').mockRejectedValue(error);

      await expect(
        service.handleUpdateLogbook(1, {} as UpdateLogbookReqBody),
      ).rejects.toThrow(new InternalServerErrorException());
      expect(handleError).toHaveBeenCalledWith(error, expect.any(LoggerUtil));

      jest.spyOn(prisma.activity, 'update').mockRejectedValue(error);
      jest
        .spyOn(prisma.activity, 'findFirst')
        .mockResolvedValue({ id: 1 } as Activity);

      await expect(
        service.handleUpdateLogbook(1, {} as UpdateLogbookReqBody),
      ).rejects.toThrow(new InternalServerErrorException());
      expect(handleError).toHaveBeenCalledWith(error, expect.any(LoggerUtil));
    });
  });
});
