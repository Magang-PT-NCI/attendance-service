import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { MonitoringService } from '../../services/monitoring.service';
import { PrismaService } from '../../services/prisma.service';
import { getDate, getDateString } from '../../utils/date.utils';
import { PatchReqBody, ReportResBody } from '../../dto/monitoring.dto';

jest.mock('../../services/prisma.service', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({
    attendance: { findMany: jest.fn(), update: jest.fn() },
    overtime: { findUnique: jest.fn(), update: jest.fn() },
    attendanceConfirmation: { findUnique: jest.fn(), update: jest.fn() },
    check: { update: jest.fn(), create: jest.fn() },
    permit: { create: jest.fn() },
    employeeCache: {
      findUnique: jest.fn().mockResolvedValue({ nik: '123456' }),
    },
    $transaction: jest.fn(),
  })),
}));
jest.mock('../../dto/monitoring.dto');

describe('monitoring service test', () => {
  let service: MonitoringService;
  let prisma: PrismaService;

  beforeAll(async () => {
    prisma = new PrismaService();
    service = new MonitoringService(prisma);

    (prisma.$transaction as jest.Mock).mockImplementation(
      (callback: (prisma: PrismaService) => any) => {
        return callback(prisma);
      },
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleDashboard test', () => {
    it('should handle prisma error', async () => {
      (prisma.attendance.findMany as jest.Mock).mockRejectedValue(new Error());

      await expect(service.handleDashboard()).rejects.toThrow(
        new InternalServerErrorException(),
      );
    });

    it('should return dashboard data', async () => {
      const attendances = [
        {
          date: new Date('2024-01-01'),
          status: 'presence',
        },
        {
          date: new Date('2024-01-01'),
          status: 'absent',
        },
        {
          date: new Date('2024-01-02'),
          status: 'presence',
        },
        {
          date: new Date('2024-01-02'),
          status: 'presence',
        },
      ];

      (prisma.attendance.findMany as jest.Mock).mockResolvedValue(attendances);

      const result = await service.handleDashboard();

      expect(result).toEqual({
        date: getDateString(new Date()),
        total_presence: 0,
        total_permit: 0,
        total_absent: 0,
        weekly_summary: {
          monday: {
            presence: 1,
            permit: 0,
            absent: 1,
          },
          tuesday: {
            presence: 2,
            permit: 0,
            absent: 0,
          },
          wednesday: expect.any(Object),
          thursday: expect.any(Object),
          friday: expect.any(Object),
          saturday: expect.any(Object),
        },
      });
    });
  });

  describe('handleReport test', () => {
    it('should handle prisma error', async () => {
      (prisma.attendance.findMany as jest.Mock).mockRejectedValue(new Error());

      await expect(
        service.handleReport(
          '',
          new Date('2024-01-01'),
          new Date('2024-01-01'),
        ),
      ).rejects.toThrow(new InternalServerErrorException());
    });

    it('should return report data', async () => {
      const data = [{ id: 1, status: 'presence' }];
      (prisma.attendance.findMany as jest.Mock).mockResolvedValue(data);
      (ReportResBody.getReport as jest.Mock).mockReturnValue(data);

      const result = await service.handleReport(
        '',
        new Date('2024-01-01'),
        new Date('2024-01-01'),
      );

      expect(result).toEqual(data);
    });
  });

  describe('handleUpdateOvertime test', () => {
    it('should handle prisma error', async () => {
      (prisma.overtime.findUnique as jest.Mock).mockRejectedValue(new Error());

      await expect(
        service.handleUpdateOvertime(1, {
          approved: true,
          approval_nik: '123456',
        } as PatchReqBody),
      ).rejects.toThrow(new InternalServerErrorException());
    });

    it('should throw NotFound if overtime does not exist', async () => {
      (prisma.overtime.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.handleUpdateOvertime(1, {
          approved: true,
          approval_nik: '123456',
        } as PatchReqBody),
      ).rejects.toThrow(new NotFoundException('data lembur tidak ditemukan'));
    });

    it('should return overtime update data', async () => {
      const updatedOvertime = { id: 1, approved: true };
      (prisma.overtime.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.overtime.update as jest.Mock).mockResolvedValue(updatedOvertime);

      expect(
        await service.handleUpdateOvertime(1, {
          approved: true,
          approval_nik: '123456',
        } as PatchReqBody),
      ).toEqual(updatedOvertime);
    });
  });

  describe('handleUpdateAttendanceConfirmation test', () => {
    const confirmation = {
      id: 1,
      attendance_id: 1,
      type: 'check_in',
      description: 'lorem ipsum dolor sit amet.',
      attachment: {
        originalname: 'image.png',
        mimetype: 'image/png',
        buffer: Buffer.from('test'),
      } as Express.Multer.File,
      checked: false,
      approved: false,
      created_at: new Date(),
      reason: null,
      attendance: {
        nik: '123456',
        check_in_id: 1,
        check_out_id: undefined,
      },
    };

    it('should handle prisma error', async () => {
      (prisma.attendanceConfirmation.findUnique as jest.Mock).mockRejectedValue(
        new Error(),
      );

      await expect(
        service.handleUpdateAttendanceConfirmation(1, {
          approved: true,
          approval_nik: '123456',
        } as PatchReqBody),
      ).rejects.toThrow(new InternalServerErrorException());
    });

    it('should throw NotFound if confirmation does not exist', async () => {
      (prisma.attendanceConfirmation.findUnique as jest.Mock).mockResolvedValue(
        null,
      );

      await expect(
        service.handleUpdateAttendanceConfirmation(1, {
          approved: true,
          approval_nik: '123456',
        } as PatchReqBody),
      ).rejects.toThrow(
        new NotFoundException('data konfirmasi kehadiran tidak ditemukan'),
      );
    });

    it('should not call transaction if confirmation not approved', async () => {
      const updatedConfirmation = { id: 1, approved: false };

      (prisma.attendanceConfirmation.findUnique as jest.Mock).mockResolvedValue(
        { id: 1 },
      );
      (prisma.attendanceConfirmation.update as jest.Mock).mockResolvedValue(
        updatedConfirmation,
      );

      expect(
        await service.handleUpdateAttendanceConfirmation(1, {
          approved: false,
          approval_nik: '123456',
          denied_description: 'lorem ipsum',
        } as PatchReqBody),
      ).toEqual(updatedConfirmation);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should handle approved check_in confirmation correctly', async () => {
      const updatedConfirmation = { id: 1, approved: true };
      confirmation.type = 'check_in';

      (prisma.attendanceConfirmation.findUnique as jest.Mock).mockResolvedValue(
        confirmation,
      );
      (prisma.attendanceConfirmation.update as jest.Mock).mockResolvedValue(
        updatedConfirmation,
      );
      (prisma.check.update as jest.Mock).mockImplementation(() => {});
      (prisma.attendance.update as jest.Mock).mockImplementation(() => {});

      expect(
        await service.handleUpdateAttendanceConfirmation(1, {
          approved: true,
          approval_nik: '123456',
        } as PatchReqBody),
      ).toEqual(updatedConfirmation);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.check.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { time: getDate('07:00') },
      });
      expect(prisma.attendance.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'presence' },
      });
    });

    it('should handle approved check_out confirmation correctly', async () => {
      const updatedConfirmation = { id: 1, approved: true };
      confirmation.type = 'check_out';

      (prisma.attendanceConfirmation.findUnique as jest.Mock).mockResolvedValue(
        confirmation,
      );
      (prisma.attendanceConfirmation.update as jest.Mock).mockResolvedValue(
        updatedConfirmation,
      );
      (prisma.check.create as jest.Mock).mockResolvedValue({ id: 2 });
      (prisma.attendance.update as jest.Mock).mockImplementation(() => {});

      expect(
        await service.handleUpdateAttendanceConfirmation(1, {
          approved: true,
          approval_nik: '123456',
        } as PatchReqBody),
      ).toEqual(updatedConfirmation);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.check.create).toHaveBeenCalledWith({
        data: {
          type: 'out',
          time: getDate('15:00'),
        },
        select: { id: true },
      });
      expect(prisma.attendance.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'presence', check_out_id: 2 },
      });
    });

    it('should handle approved permit confirmation correctly', async () => {
      const updatedConfirmation = { id: 1, approved: true };
      confirmation.type = 'permit';
      confirmation.reason = 'sakit';

      (prisma.attendanceConfirmation.findUnique as jest.Mock).mockResolvedValue(
        confirmation,
      );
      (prisma.attendanceConfirmation.update as jest.Mock).mockResolvedValue(
        updatedConfirmation,
      );
      (prisma.permit.create as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.attendance.update as jest.Mock).mockImplementation(() => {});

      expect(
        await service.handleUpdateAttendanceConfirmation(1, {
          approved: true,
          approval_nik: '123456',
        } as PatchReqBody),
      ).toEqual(updatedConfirmation);
      expect(prisma.$transaction).toHaveBeenCalled();
      expect(prisma.permit.create).toHaveBeenCalledWith({
        data: {
          nik: '123456',
          reason: 'sakit',
          start_date: getDate(getDateString(confirmation.created_at)),
          duration: 1,
          permission_letter: confirmation.attachment,
          approved: true,
          checked: true,
        },
        select: { id: true },
      });
      expect(prisma.attendance.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'permit', permit_id: 1 },
      });
    });
  });
});
