import { Test, TestingModule } from '@nestjs/testing';
import { LogbookController } from '../../controllers/logbook.controller';
import { LogbookService } from '../../services/logbook.service';
import { BadRequestException } from '@nestjs/common';
import {
  LogbookReqBody,
  UpdateLogbookReqBody,
  UpdateLogbookParam,
} from '../../dto/logbook.dto';
import { ActivityStatus } from '@prisma/client';
import { getDate, isValidTime } from '../../utils/date.utils';

jest.mock('../../utils/date.utils');

describe('logbook controller test', () => {
  let controller: LogbookController;
  let logbookService: LogbookService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LogbookController],
      providers: [
        {
          provide: LogbookService,
          useValue: {
            handlePostLogbook: jest.fn(),
            handleUpdateLogbook: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<LogbookController>(LogbookController);
    logbookService = module.get<LogbookService>(LogbookService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('postLogbook test', () => {
    it('should throw BadRequestException if required fields are missing', async () => {
      const body: LogbookReqBody = {
        attendance_id: undefined,
        description: 'Test logbook entry',
        status: 'progress',
        start_time: '08:00',
        end_time: '17:00',
      };

      await expect(controller.postLogbook(body)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if status is invalid', async () => {
      const body: LogbookReqBody = {
        attendance_id: 1,
        description: 'Test logbook entry',
        status: 'invalid' as ActivityStatus,
        start_time: '08:00',
        end_time: '17:00',
      };

      await expect(controller.postLogbook(body)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should call handlePostLogbook with valid data', async () => {
      const body: LogbookReqBody = {
        attendance_id: 1,
        description: 'Test logbook entry',
        status: 'progress',
        start_time: '08:00',
        end_time: '17:00',
      };

      await controller.postLogbook(body);

      expect(logbookService.handlePostLogbook).toHaveBeenCalledWith(body);
    });
  });

  describe('updateLogbook test', () => {
    it('should throw BadRequestException if activity_id is invalid', async () => {
      const params: UpdateLogbookParam = { activity_id: 'invalid' as any };
      const body: UpdateLogbookReqBody = {
        description: 'Updated logbook entry',
      };

      await expect(controller.updateLogbook(params, body)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if status is invalid', async () => {
      const params: UpdateLogbookParam = { activity_id: 1 };
      const body: UpdateLogbookReqBody = {
        status: 'invalid' as ActivityStatus,
      };

      await expect(controller.updateLogbook(params, body)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should call handleUpdateLogbook with valid data', async () => {
      const params: UpdateLogbookParam = { activity_id: 1 };
      const body: UpdateLogbookReqBody = {
        description: 'Updated logbook entry',
        status: 'done',
        start_time: '09:00',
        end_time: '17:00',
      };

      (isValidTime as jest.Mock).mockReturnValue(true);
      (getDate as jest.Mock).mockImplementation((time) => ({
        toISOString: () => `${time}:00Z`,
      }));

      await controller.updateLogbook(params, body);

      expect(logbookService.handleUpdateLogbook).toHaveBeenCalledWith(1, {
        description: 'Updated logbook entry',
        status: 'done',
        start_time: '09:00:00Z',
        end_time: '17:00:00Z',
      });
    });
  });
});
