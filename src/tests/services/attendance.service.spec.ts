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
  AttendanceConfirmationResBody,
  AttendancePostReqBody,
  AttendancePostResBody,
  AttendanceResBody,
  OvertimeResBody,
} from '../../dto/attendance.dto';
import { uploadFile } from '../../utils/upload.utils';
import { ConfirmationType } from '@prisma/client';

jest.mock('../../utils/api.utils');
jest.mock('../../utils/date.utils');
jest.mock('../../utils/upload.utils');
jest.mock('../../dto/attendance.dto');
jest.mock('../../services/prisma.service', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({
    attendance: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    attendanceConfirmation: { findFirst: jest.fn(), create: jest.fn() },
    check: { create: jest.fn() },
    overtime: { create: jest.fn() },
    $transaction: jest.fn(),
  })),
}));

describe('attendance service test', () => {
  let service: AttendanceService;
  let prisma: PrismaService;

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

  beforeAll(() => {
    prisma = new PrismaService();
    service = new AttendanceService(prisma);

    (prisma.$transaction as jest.Mock).mockImplementation(
      (callback: (prisma: PrismaService) => any) => {
        return callback(prisma);
      },
    );
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

    it('should handle prisma error', async () => {
      (getEmployee as jest.Mock).mockReturnValue({ nik });
      (prisma.attendance.findFirst as jest.Mock).mockRejectedValue(new Error());

      await expect(
        service.handleGetAttendance(nik, filter, date),
      ).rejects.toThrow(new InternalServerErrorException());
      expect(getEmployee).toHaveBeenCalledWith(nik);
    });
  });

  describe('handleCheckIn test', () => {
    it('should throw InternalServerError when network or database problem occurred', async () => {
      (prisma.attendance.findFirst as jest.Mock).mockRejectedValue(new Error());
      mockDate('06:30');

      await expect(service.handleCheckIn(attendanceData)).rejects.toThrow(
        new InternalServerErrorException(),
      );
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
        select: expect.any(Object),
      });
    });
  });

  describe('handleCheckOut test', () => {
    const attendance = {
      checkIn: { time: '06:10' },
      check_out_id: null,
      activities: [{ id: 1 }],
      overtime_id: null,
    };

    it('should throw InternalServerError when network or database problem occurred', async () => {
      (prisma.attendance.findFirst as jest.Mock).mockRejectedValue(new Error());
      mockDate('14:05');

      await expect(service.handleCheckOut(attendanceData)).rejects.toThrow(
        new InternalServerErrorException(),
      );
    });

    it('should throw ConflictException if employee does not checked in first', async () => {
      for (const attendance of [null, { checkIn: null }]) {
        (prisma.attendance.findFirst as jest.Mock).mockResolvedValue(
          attendance,
        );
        mockDate('14:05');

        await expect(service.handleCheckOut(attendanceData)).rejects.toThrow(
          new ConflictException('tidak dapat check out sebelum check in'),
        );
      }
    });

    it('should throw ConflictException if employee have been checked out', async () => {
      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue({
        checkIn: { time: '06:10' },
        check_out_id: 2,
      });
      mockDate('14:05');

      await expect(service.handleCheckOut(attendanceData)).rejects.toThrow(
        new ConflictException('check out telah dilakukan'),
      );
    });

    it('should throw ConflictException if employee does not fill the logbooks', async () => {
      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue({
        checkIn: { time: '06:10' },
        check_out_id: null,
        activities: [],
      });
      mockDate('14:05');

      await expect(service.handleCheckOut(attendanceData)).rejects.toThrow(
        new ConflictException('harus mengisi logbook terlebih dahulu'),
      );
    });

    it('should throw ConflictException if employee perform check out outside the time', async () => {
      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue(attendance);
      mockDate('17:00');

      await expect(service.handleCheckOut(attendanceData)).rejects.toThrow(
        new ConflictException(
          'tidak dapat melakukan check out setelah pukul 15:00',
        ),
      );

      attendance.overtime_id = 1;
      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue(attendance);
      mockDate('20:00');

      await expect(service.handleCheckOut(attendanceData)).rejects.toThrow(
        new ConflictException(
          'tidak dapat melakukan check out setelah pukul 19:00',
        ),
      );
    });

    it('should return success to perform check out', async () => {
      attendance.overtime_id = null;
      attendance.check_out_id = null;
      mockDate('14:05');

      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue(attendance);
      (prisma.attendance.update as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.check.create as jest.Mock).mockResolvedValue({ id: 2 });
      (uploadFile as jest.Mock).mockResolvedValue('image.png');
      (AttendancePostResBody as jest.Mock).mockReturnValue({
        id: 1,
        status: 'presence',
      });

      expect(await service.handleCheckOut(attendanceData)).toEqual({
        id: 1,
        status: 'presence',
      });
      expect(uploadFile).toHaveBeenCalledWith(
        attendanceData.photo,
        attendanceData.nik,
        attendanceData.type,
      );
      expect(prisma.check.create).toHaveBeenCalledWith({
        data: {
          type: 'out',
          time: '1970-01-01T14:05:00.000Z',
          location: '123,123',
          photo: 'image.png',
        },
      });
      expect(prisma.attendance.update).toHaveBeenCalledWith({
        where: expect.any(Object),
        select: expect.any(Object),
        data: { check_out_id: 2 },
      });
    });
  });

  describe('handleOvertime test', () => {
    const nik = '123456';
    const attendance = {
      id: 1,
      checkIn: { time: '06:10' },
      check_out_id: null,
      activities: [{ id: 1 }],
      overtime_id: null,
    };

    it('should throw ConflictException if current date does not valid', async () => {
      mockDate('13:00');

      await expect(service.handleOvertime(nik)).rejects.toThrow(
        new ConflictException(
          'konfirmasi lembur hanya dapat dilakukan pada pukul 14:00 hingga 15:00',
        ),
      );
    });

    it('should throw ConflictException if employee does not checked in', async () => {
      mockDate('14:10');
      attendance.checkIn = null;
      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue(attendance);

      await expect(service.handleOvertime(nik)).rejects.toThrow(
        new ConflictException(
          'tidak dapat melakukan konfirmasi lembur karena belum melakukan check in',
        ),
      );
    });

    it('should throw ConflictException if employee have been checked out', async () => {
      mockDate('14:10');
      attendance.checkIn = { time: '06:10' };
      attendance.check_out_id = 2;
      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue(attendance);

      await expect(service.handleOvertime(nik)).rejects.toThrow(
        new ConflictException(
          'tidak dapat melakukan konfirmasi lembur karena telah melakukan check out',
        ),
      );
    });

    it('should throw ConflictException if employee already have overtime', async () => {
      mockDate('14:10');
      attendance.checkIn = { time: '06:10' };
      attendance.check_out_id = null;
      attendance.overtime_id = 1;
      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue(attendance);

      await expect(service.handleOvertime(nik)).rejects.toThrow(
        new ConflictException('telah melakukan konfirmasi lembur'),
      );
    });

    it('should success to request overtime', async () => {
      mockDate('14:10');
      attendance.checkIn = { time: '06:10' };
      attendance.check_out_id = null;
      attendance.overtime_id = null;

      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue(attendance);
      (prisma.overtime.create as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.attendance.update as jest.Mock).mockResolvedValue({ id: 1 });
      (OvertimeResBody as jest.Mock).mockReturnValue({ id: 1 });

      expect(await service.handleOvertime(nik)).toEqual({ id: 1 });
      expect(prisma.overtime.create).toHaveBeenCalledWith({
        data: { approved: false, checked: false },
      });
      expect(prisma.attendance.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { overtime_id: 1 },
      });
    });
  });

  describe('handleAttendanceConfirmation test', () => {
    const confirmation = {
      attendance_id: 1,
      type: 'check_in' as ConfirmationType,
      description: 'lorem ipsum',
      reason: null,
      attachment: {
        originalname: 'image.png',
        mimetype: 'image/png',
        buffer: Buffer.from('test'),
      } as Express.Multer.File,
    };

    it('should throw ConflictException if there is existing confirmation', async () => {
      (prisma.attendanceConfirmation.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
      });

      await expect(
        service.handleAttendanceConfirmation(confirmation),
      ).rejects.toThrow(
        new ConflictException(
          'Anda masih memiliki konfirmasi yang belum diperiksa!',
        ),
      );
    });

    it('should success to request attendance confirmation', async () => {
      (prisma.attendanceConfirmation.findFirst as jest.Mock).mockResolvedValue(
        null,
      );
      (AttendanceConfirmationResBody as jest.Mock).mockReturnValue({ id: 1 });

      expect(await service.handleAttendanceConfirmation(confirmation)).toEqual({
        id: 1,
      });
    });
  });
});
