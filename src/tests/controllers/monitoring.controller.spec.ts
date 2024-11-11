import { Test, TestingModule } from '@nestjs/testing';
import { MonitoringController } from '../../controllers/monitoring.controller';
import { MonitoringService } from '../../services/monitoring.service';
import { BadRequestException } from '@nestjs/common';
import {
  PatchReqBody,
  PatchReqParam,
  ReportQuery,
} from '../../dto/monitoring.dto';
import { getDate, getDateString } from '../../utils/date.utils';

jest.mock('../../utils/date.utils');

describe('monitoring controller test', () => {
  let controller: MonitoringController;
  let monitoringService: MonitoringService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MonitoringController],
      providers: [
        {
          provide: MonitoringService,
          useValue: {
            handleDashboard: jest.fn(),
            handleReport: jest.fn(),
            handleUpdateOvertime: jest.fn(),
            handleUpdateAttendanceConfirmation: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MonitoringController>(MonitoringController);
    monitoringService = module.get<MonitoringService>(MonitoringService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('dashboard test', () => {
    it('should call handleDashboard method of MonitoringService', async () => {
      await controller.dashboard();
      expect(monitoringService.handleDashboard).toHaveBeenCalled();
    });
  });

  describe('report test', () => {
    it('should call handleReport with default dates when query is empty', async () => {
      const query = {} as ReportQuery;
      const mockDate = new Date();

      (getDate as jest.Mock).mockReturnValue(mockDate);
      (getDateString as jest.Mock).mockReturnValue(mockDate.toISOString());

      await controller.report(query);
      expect(monitoringService.handleReport).toHaveBeenCalledWith(
        '',
        mockDate,
        mockDate,
      );
    });

    it('should call handleReport with given dates and keyword', async () => {
      const query: ReportQuery = {
        keyword: 'test',
        from: '2023-01-01',
        to: '2023-01-31',
      };

      const from = new Date('2023-01-01');
      const to = new Date('2023-01-31');

      (getDate as jest.Mock).mockImplementation((date) => new Date(date));

      await controller.report(query);
      expect(monitoringService.handleReport).toHaveBeenCalledWith(
        'test',
        from,
        to,
      );
    });
  });

  describe('updateOvertime test', () => {
    it('should throw BadRequestException if approved is not a boolean', async () => {
      const param: PatchReqParam = { id: 1 };
      const body: PatchReqBody = { approved: 'not_boolean' as any };

      await expect(controller.updateOvertime(param, body)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if id is not a valid number', async () => {
      const param = { id: 'invalid_id' } as unknown as PatchReqParam;
      const body: PatchReqBody = { approved: true };

      await expect(controller.updateOvertime(param, body)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should call handleUpdateOvertime with valid data', async () => {
      const param: PatchReqParam = { id: 1 };
      const body: PatchReqBody = { approved: true };

      await controller.updateOvertime(param, body);
      expect(monitoringService.handleUpdateOvertime).toHaveBeenCalledWith(
        1,
        true,
      );
    });
  });

  describe('updateAttendanceConfirmation test', () => {
    it('should throw BadRequestException if approved is not a boolean', async () => {
      const param: PatchReqParam = { id: 1 };
      const body: PatchReqBody = { approved: 'not_boolean' as any };

      await expect(
        controller.updateAttendanceConfirmation(param, body),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if id is not a valid number', async () => {
      const param = {
        id: 'invalid_id',
      } as unknown as PatchReqParam;
      const body: PatchReqBody = { approved: true };

      await expect(
        controller.updateAttendanceConfirmation(param, body),
      ).rejects.toThrow(BadRequestException);
    });

    it('should call handleUpdateAttendanceConfirmation with valid data', async () => {
      const param = { id: 1 };
      const body: PatchReqBody = { approved: true };

      await controller.updateAttendanceConfirmation(param, body);
      expect(
        monitoringService.handleUpdateAttendanceConfirmation,
      ).toHaveBeenCalledWith(1, true);
    });
  });
});
