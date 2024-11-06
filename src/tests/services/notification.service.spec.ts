import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { NotificationService } from '../../services/notification.service';
import { PrismaService } from '../../services/prisma.service';
import { APP_URL } from '../../config/app.config';

jest.mock('../../services/prisma.service', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({
    attendance: { findFirst: jest.fn(), findMany: jest.fn() },
    employeeCache: { findUnique: jest.fn() },
    attendanceConfirmation: { findMany: jest.fn() },
    permit: { findFirst: jest.fn(), findMany: jest.fn() },
  })),
}));

describe('notification service test', () => {
  let service: NotificationService;
  let prisma: PrismaService;

  beforeAll(async () => {
    prisma = new PrismaService();
    service = new NotificationService(prisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleOnSiteNotification test', () => {
    const nik = '123456';
    const name = 'ucup';

    it('should handle prisma error', async () => {
      (prisma.employeeCache.findUnique as jest.Mock).mockResolvedValue({
        name,
      });
      (prisma.attendance.findFirst as jest.Mock).mockRejectedValue(new Error());

      await expect(service.handleOnSiteNotification(nik)).rejects.toThrow(
        new InternalServerErrorException(),
      );
    });

    it('should throw NotFoundException if employee does not found', async () => {
      (prisma.employeeCache.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.handleOnSiteNotification(nik)).rejects.toThrow(
        new NotFoundException('Karyawan tidak ditemukan!'),
      );
    });

    it('should return onsite notification correctly', async () => {
      (prisma.employeeCache.findUnique as jest.Mock).mockResolvedValue({
        name,
      });
      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        status: 'presence',
        overtime: null,
        checkIn: { time: new Date('1970-01-01T07:20:00.000Z') },
      });
      (prisma.attendanceConfirmation.findMany as jest.Mock).mockResolvedValue([
        {
          approved: false,
          checked: false,
          created_at: new Date('2024-01-01T00:25:00.000Z'),
          attachment: '2024-01-01_test.docx',
          type: 'check_in',
          description: 'lorem ipsum dolor sit amet',
        },
      ]);
      (prisma.permit.findFirst as jest.Mock).mockResolvedValue(null);

      expect(await service.handleOnSiteNotification(nik)).toEqual([
        {
          nik: '123456',
          name: 'ucup',
          message:
            'Konfirmasi kehadiran check in Anda hari ini belum disetujui oleh Koordinator.' +
            '\nDeskripsi konfirmasi kehadiran:\nlorem ipsum dolor sit amet',
          date: '07:25',
          file: `${APP_URL}/files/confirmation/2024-01-01_test.docx`,
          action_endpoint: null,
        },
        {
          nik: '123456',
          name: 'ucup',
          message: 'Anda terlambat 20 menit hari ini.',
          date: '07:20',
          file: null,
          action_endpoint: null,
        },
      ]);
    });
  });

  describe('handleCoordinatorNotification test', () => {
    it('should handle prisma error', async () => {
      (prisma.attendance.findMany as jest.Mock).mockRejectedValue(new Error());

      await expect(service.handleCoordinatorNotification()).rejects.toThrow(
        new InternalServerErrorException(),
      );
    });

    it('should return coordinator notification correctly', async () => {
      (prisma.attendance.findMany as jest.Mock).mockResolvedValue([
        {
          status: 'absent',
          employee: { nik: '123456', name: 'ucup' },
          checkIn: null,
          overtime: null,
        },
      ]);
      (prisma.attendanceConfirmation.findMany as jest.Mock).mockResolvedValue([
        {
          id: 1,
          approved: false,
          checked: false,
          created_at: new Date('2024-01-01T00:25:00.000Z'),
          attachment: '2024-01-01_test.docx',
          type: 'check_in',
          description: 'lorem ipsum dolor sit amet',
          attendance: {
            employee: { nik: '123456', name: 'ucup' },
            status: 'absent',
            check_out_id: 2,
            checkIn: null,
          },
        },
      ]);
      (prisma.permit.findMany as jest.Mock).mockResolvedValue([]);

      expect(await service.handleCoordinatorNotification()).toEqual([
        {
          nik: '123456',
          name: 'ucup',
          message:
            "Melakukan konfirmasi kehadiran check in dengan status awal 'tidak hadir'." +
            '\n\nDeskripsi Konfirmasi Kehadiran:\n"lorem ipsum dolor sit amet"' +
            '\n\nJika disetujui, waktu check in OnSite akan diubah menjadi 07:00.',
          date: '07:25',
          file: `${APP_URL}/files/confirmation/2024-01-01_test.docx`,
          action_endpoint: '/monitoring/confirmation/1',
        },
        {
          nik: '123456',
          name: 'ucup',
          message: 'Tidak masuk hari ini.',
          date: '09:01',
          file: null,
          action_endpoint: null,
        },
      ]);
    });
  });
});
