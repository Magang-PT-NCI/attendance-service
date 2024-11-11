import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceController } from '../../controllers/attendance.controller';
import { AttendanceService } from '../../services/attendance.service';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  AttendanceQuery,
  AttendanceParam,
  AttendanceConfirmationReqBody,
  OvertimeReqBody,
  AttendancePostResBody,
  AttendanceResBody,
  OvertimeResBody,
  AttendanceConfirmationResBody,
} from '../../dto/attendance.dto';
import { getEmployee } from '../../utils/api.utils';
import * as sharp from 'sharp';

jest.mock('../../utils/api.utils', () => ({
  getEmployee: jest.fn().mockResolvedValue({ nik: '123456' }),
}));
jest.mock('sharp');

describe('attendance controller test', () => {
  let controller: AttendanceController;
  let service: AttendanceService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendanceController],
      providers: [
        {
          provide: AttendanceService,
          useValue: {
            handleGetAttendance: jest.fn(),
            handleCheckIn: jest.fn(),
            handleCheckOut: jest.fn(),
            handleOvertime: jest.fn(),
            handleAttendanceConfirmation: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AttendanceController>(AttendanceController);
    service = module.get<AttendanceService>(AttendanceService);
  });

  describe('getAttendance test', () => {
    const param: AttendanceParam = { nik: '123' };
    const query: AttendanceQuery = { filter: 'all', date: '2023-12-01' };

    it('should return attendance data', async () => {
      const attendanceData: AttendanceResBody = {
        activities: [],
        id: 1,
        date: '2024-01-01',
        status: 'presence',
      };

      jest
        .spyOn(service, 'handleGetAttendance')
        .mockResolvedValue(attendanceData);

      const result = await controller.getAttendance(param, query);
      expect(result).toEqual(attendanceData);
    });

    it('should return null', async () => {
      jest.spyOn(service, 'handleGetAttendance').mockResolvedValue(null);

      const result = await controller.getAttendance(param, query);
      expect(result).toBeNull();
    });
  });

  describe('postAttendance test', () => {
    const body = {
      nik: '123',
      type: 'check_in',
      location: { latitude: 123, longitude: 123 },
      photo: {
        mimetype: 'image/jpeg',
        originalname: 'test.jpg',
        buffer: Buffer.from(''),
      } as Express.Multer.File,
    };

    it('should return correct check in response', async () => {
      const response: AttendancePostResBody = {
        attendance_id: 1,
        nik: '123456',
        type: 'check_in',
        time: '06:30',
        photo: 'image.png',
        location: { latitude: 123, longitude: 123 },
      };
      jest.spyOn(service, 'handleCheckIn').mockResolvedValue(response);
      (sharp as unknown as jest.Mock).mockImplementation(() => ({
        metadata: jest.fn().mockResolvedValue({ width: 100, height: 100 }),
      }));

      body.type = 'check_in';
      const result = await controller.postAttendance(body);
      expect(result).toEqual(response);
    });

    it('should return correct check out response', async () => {
      const response: AttendancePostResBody = {
        attendance_id: 1,
        nik: '123456',
        type: 'check_out',
        time: '14:30',
        photo: 'image.png',
        location: { latitude: 123, longitude: 123 },
      };
      jest.spyOn(service, 'handleCheckOut').mockResolvedValue(response);
      (sharp as unknown as jest.Mock).mockImplementation(() => ({
        metadata: jest.fn().mockResolvedValue({ width: 100, height: 100 }),
      }));

      body.type = 'check_out';
      const result = await controller.postAttendance(body);
      expect(result).toEqual(response);
    });

    it('should throw BadRequestException for invalid image size', async () => {
      const response: AttendancePostResBody = {
        attendance_id: 1,
        nik: '123456',
        type: 'check_in',
        time: '06:30',
        photo: 'image.png',
        location: { latitude: 123, longitude: 123 },
      };
      jest.spyOn(service, 'handleCheckIn').mockResolvedValue(response);
      (sharp as unknown as jest.Mock).mockImplementation(() => ({
        metadata: jest.fn().mockResolvedValue({ width: 90, height: 100 }),
      }));

      await expect(controller.postAttendance(body)).rejects.toThrow(
        new BadRequestException('photo harus gambar dengan rasio 1:1'),
      );
    });

    it('should throw InternalServerErrorException for sharp error', async () => {
      const response: AttendancePostResBody = {
        attendance_id: 1,
        nik: '123456',
        type: 'check_in',
        time: '06:30',
        photo: 'image.png',
        location: { latitude: 123, longitude: 123 },
      };
      jest.spyOn(service, 'handleCheckIn').mockResolvedValue(response);
      (sharp as unknown as jest.Mock).mockImplementation(() => {
        throw new Error();
      });

      await expect(controller.postAttendance(body)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw NotFoundException if employee not found', async () => {
      (getEmployee as jest.Mock).mockResolvedValue(null);
      jest.spyOn(service, 'handleCheckIn').mockImplementation(() => {
        throw new NotFoundException('karyawan tidak ditemukan');
      });
      (sharp as unknown as jest.Mock).mockImplementation(() => ({
        metadata: jest.fn().mockResolvedValue({ width: 100, height: 100 }),
      }));

      await expect(controller.postAttendance(body)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('overtime test', () => {
    it('should handle valid overtime request', async () => {
      const body: OvertimeReqBody = { nik: '123' };
      const response: OvertimeResBody = {
        id: 1,
        approved: false,
        attendance_id: 1,
        date: '2024-01-01',
      };

      jest.spyOn(service, 'handleOvertime').mockResolvedValue(response);

      const result = await controller.overtime(body);
      expect(result).toEqual(response);
    });

    it('should throw BadRequestException if nik is missing', async () => {
      const body: OvertimeReqBody = { nik: '' };

      await expect(controller.overtime(body)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('attendanceConfirmation test', () => {
    const body = {
      type: 'check_in',
      reason: null,
      attendance_id: 1,
      description: 'lorem ipsum',
      attachment: {
        mimetype: 'image/jpeg',
        originalname: 'test.jpg',
        buffer: Buffer.from(''),
      } as Express.Multer.File,
    };

    it('should handle valid confirmation request', async () => {
      const response: AttendanceConfirmationResBody = {
        id: 1,
        attendance_id: 1,
        type: 'check_in',
        description: 'lorem ipsum',
        attachment: 'attachment.docx',
        approved: false,
      };

      jest
        .spyOn(service, 'handleAttendanceConfirmation')
        .mockResolvedValue(response);

      const result = await controller.attendanceConfirmation(
        body as AttendanceConfirmationReqBody,
      );
      expect(result).toEqual(response);
    });

    it('should throw BadRequestException for invalid confirmation type', async () => {
      body.type = 'coba';
      await expect(
        controller.attendanceConfirmation(
          body as AttendanceConfirmationReqBody,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for missing reason on permit type', async () => {
      body.type = 'permit';
      body.reason = null;

      await expect(
        controller.attendanceConfirmation(
          body as AttendanceConfirmationReqBody,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
