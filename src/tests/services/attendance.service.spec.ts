import { AttendanceService } from '../../services/attendance.service';
import { PrismaService } from '../../services/prisma.service';
import { getEmployee } from '../../utils/api.utils';
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { getDate } from '../../utils/date.utils';
import {
  AttendancePostReqBody,
  AttendancePostResBody,
  AttendanceResBody,
} from '../../dto/attendance.dto';
import { uploadFile } from '../../utils/upload.utils';

jest.mock('../../utils/api.utils');
jest.mock('../../utils/date.utils');
jest.mock('../../utils/upload.utils');
jest.mock('../../dto/attendance.dto');
jest.mock('../../services/prisma.service', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({
    attendance: { findFirst: jest.fn(), create: jest.fn() },
    check: { create: jest.fn() },
  })),
}));

describe('attendance service test', () => {
  let service: AttendanceService;
  let prisma: PrismaService;

  beforeEach(() => {
    prisma = new PrismaService();
    service = new AttendanceService(prisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleGetAttendance test', () => {
    const nik = '123';
    const filter = 'all';
    const date = '2024-01-01';
    const where = { nik, date: getDate(date) };

    it('should throw NotFoundException when employee does not exist', async () => {
      (getEmployee as jest.Mock).mockReturnValue(null);
      await expect(
        service.handleGetAttendance(nik, filter, date),
      ).rejects.toThrow(new NotFoundException('karyawan tidak ditemukan'));
      expect(getEmployee).toHaveBeenCalledWith(nik);
    });

    it('should return null when attendance does not exist', async () => {
      (getEmployee as jest.Mock).mockReturnValue({ nik });
      (prisma.attendance.findFirst as jest.Mock).mockReturnValue(null);

      expect(await service.handleGetAttendance(nik, filter, date)).toBeNull();
      expect(getEmployee).toHaveBeenCalledWith(nik);
      expect(prisma.attendance.findFirst).toHaveBeenCalledWith({
        where,
        select: expect.anything(),
      });
    });

    it('should return AttendanceResBody when success get attendance', async () => {
      const mockAttendance = {
        id: 1,
        date: new Date('2024-01-01'),
        status: 'presence',
      };

      (getEmployee as jest.Mock).mockReturnValue({ nik });
      (prisma.attendance.findFirst as jest.Mock).mockReturnValue(
        mockAttendance,
      );
      (AttendanceResBody as jest.Mock).mockReturnValue(mockAttendance);

      expect(await service.handleGetAttendance(nik, filter, date)).toBe(
        mockAttendance,
      );
      expect(getEmployee).toHaveBeenCalledWith(nik);
      expect(prisma.attendance.findFirst).toHaveBeenCalledWith({
        where,
        select: expect.anything(),
      });
    });
  });

  describe('handleCheckIn test', () => {
    const attendanceData: AttendancePostReqBody = {
      nik: '12345',
      type: 'check_in',
      location: { latitude: 123, longitude: 123 },
      photo: {
        originalname: 'image.png',
        mimetype: 'image/png',
        buffer: Buffer.from('test'),
      } as Express.Multer.File,
    };

    const mockDate = (timeString: string) => {
      (getDate as jest.Mock).mockImplementationOnce(() => {
        const date = new Date(`2024-01-01T${timeString}:00.000Z`);
        date.setHours(date.getHours() - 7);
        return date;
      });
      (getDate as jest.Mock).mockReturnValueOnce(new Date('2024-01-01'));
      (getDate as jest.Mock).mockReturnValueOnce(
        new Date(`1970-01-01T${timeString}:00.000Z`),
      );
    };

    it('should throw InternalServerError when network or database problem occurred', async () => {
      const callHandler = async () => {
        mockDate('06:30');
        await expect(service.handleCheckIn(attendanceData)).rejects.toThrow(
          new InternalServerErrorException(),
        );
      };

      (prisma.attendance.findFirst as jest.Mock).mockRejectedValue(new Error());
      await callHandler();

      (prisma.attendance.findFirst as jest.Mock).mockReturnValue(null);
      (uploadFile as jest.Mock).mockRejectedValue(
        new InternalServerErrorException(),
      );
      await callHandler();

      (uploadFile as jest.Mock).mockReturnValue('image.png');
      (prisma.check.create as jest.Mock).mockRejectedValue(new Error());
      await callHandler();

      (prisma.check.create as jest.Mock).mockReturnValue({ id: 1 });
      (prisma.attendance.create as jest.Mock).mockRejectedValue(new Error());
      await callHandler();
    });

    it('should throw ConflictException when check in time is invalid', async () => {
      for (const timeString of ['04:00', '04:30', '05:30', '05:59']) {
        mockDate(timeString);
        await expect(service.handleCheckIn(attendanceData)).rejects.toThrow(
          new ConflictException(
            'tidak dapat melakukan check in sebelum pukul 06:00',
          ),
        );
      }

      for (const timeString of ['09:01', '09:30', '10:00', '10:30']) {
        mockDate(timeString);
        await expect(service.handleCheckIn(attendanceData)).rejects.toThrow(
          new ConflictException(
            'tidak dapat melakukan check in setelah pukul 09:00',
          ),
        );
      }
    });

    it('should throw ConflictException when attendance data already exist', async () => {
      (prisma.attendance.findFirst as jest.Mock).mockReturnValue({ id: 1 });
      mockDate('06:30');

      await expect(service.handleCheckIn(attendanceData)).rejects.toThrow(
        new ConflictException(
          'karyawan telah melakukan check in atau memiliki izin yang telah disetujui',
        ),
      );
    });

    it('should return AttendancePostBody when success perform attendance', async () => {
      (prisma.attendance.findFirst as jest.Mock).mockReturnValue(null);
      (prisma.check.create as jest.Mock).mockReturnValue({ id: 1 });
      (uploadFile as jest.Mock).mockReturnValue('image.png');
      mockDate('06:30');

      const resultMock = {
        nik: '123',
        type: 'check_in',
      } as AttendancePostResBody;
      (AttendancePostResBody as jest.Mock).mockReturnValue(resultMock);

      expect(await service.handleCheckIn(attendanceData)).toEqual(resultMock);
      expect(uploadFile).toHaveBeenCalledWith(
        attendanceData.photo,
        attendanceData.nik,
        attendanceData.type,
      );
      expect(prisma.check.create).toHaveBeenCalledWith({
        data: {
          type: 'in',
          time: '1970-01-01T06:30:00.000Z',
          location: '123,123',
          photo: 'image.png',
        },
      });
      expect(prisma.attendance.create).toHaveBeenCalledWith({
        data: {
          nik: attendanceData.nik,
          check_in_id: 1,
          date: '2024-01-01T00:00:00.000Z',
          status: 'presence',
        },
      });
    });
  });
});
