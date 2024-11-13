import {
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { NotificationService } from '../../services/notification.service';
import { PrismaService } from '../../services/prisma.service';

jest.mock('../../services/prisma.service', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({
    attendance: { findFirst: jest.fn(), findMany: jest.fn() },
    attendanceConfirmation: { findMany: jest.fn() },
    employeeCache: { findUnique: jest.fn() },
    permit: { findFirst: jest.fn(), findMany: jest.fn() },
  })),
}));

describe('NotificationService', () => {
  const mockEmployee = { nik: '12345', name: 'John Doe', area: 'Bandung' };
  const mockAttendance = {
    id: 1,
    status: 'presence',
    checkIn: { time: new Date('2023-10-10T07:05:00Z') },
    overtime: { approved: false, checked: false, created_at: new Date() },
  };
  const mockPermit = {
    start_date: new Date(),
    duration: 2,
    approved: false,
    checked: false,
    created_at: new Date(),
    permission_letter: 'mock-file-url',
  };

  let service: NotificationService;
  let prisma: PrismaService;

  beforeAll(async () => {
    prisma = new PrismaService();
    service = new NotificationService(prisma);
  });

  describe('handleOnSiteNotification', () => {
    it('should throw NotFoundException if employee is not found', async () => {
      (prisma.employeeCache.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.handleOnSiteNotification('invalid-nik'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should generate late notification if employee is late', async () => {
      (prisma.employeeCache.findUnique as jest.Mock).mockResolvedValue(
        mockEmployee,
      );
      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue({
        ...mockAttendance,
        checkIn: { time: new Date('2023-10-10T07:15:00Z') },
      });
      (prisma.attendanceConfirmation.findMany as jest.Mock).mockResolvedValue(
        [],
      );

      const notifications = await service.handleOnSiteNotification(
        mockEmployee.nik,
      );
      const lateNotification = notifications.find((n) =>
        n.message.includes('Anda terlambat'),
      );

      expect(lateNotification).toBeDefined();
      expect(lateNotification.message).toContain('Anda terlambat');
    });

    it('should generate absence notification if employee is absent', async () => {
      (prisma.employeeCache.findUnique as jest.Mock).mockResolvedValue(
        mockEmployee,
      );
      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue({
        ...mockAttendance,
        status: 'absent',
        checkIn: null,
      });
      (prisma.attendanceConfirmation.findMany as jest.Mock).mockResolvedValue(
        [],
      );

      const notifications = await service.handleOnSiteNotification(
        mockEmployee.nik,
      );
      const absentNotification = notifications.find((n) =>
        n.message.includes('Anda tidak masuk hari ini'),
      );

      expect(absentNotification).toBeDefined();
      expect(absentNotification.message).toBe('Anda tidak masuk hari ini.');
    });

    it('should generate permit approval notification if permit is approved', async () => {
      (prisma.employeeCache.findUnique as jest.Mock).mockResolvedValue(
        mockEmployee,
      );
      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue({
        ...mockAttendance,
        checkIn: null,
        status: 'permit',
      });
      (prisma.attendanceConfirmation.findMany as jest.Mock).mockResolvedValue(
        [],
      );
      (prisma.permit.findFirst as jest.Mock).mockResolvedValue({
        ...mockPermit,
        approved: true,
      });

      const notifications = await service.handleOnSiteNotification(
        mockEmployee.nik,
      );
      const permitNotification = notifications.find((n) =>
        n.message.includes('Izin Anda hari ini telah disetujui'),
      );

      expect(permitNotification).toBeDefined();
      expect(permitNotification.message).toContain(
        'Izin Anda hari ini telah disetujui',
      );
    });

    it('should handle confirmation notifications with attachment', async () => {
      (prisma.employeeCache.findUnique as jest.Mock).mockResolvedValue(
        mockEmployee,
      );
      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue(
        mockAttendance,
      );
      (prisma.attendanceConfirmation.findMany as jest.Mock).mockResolvedValue([
        {
          approved: false,
          checked: true,
          created_at: new Date(),
          attachment: 'confirmation-attachment-url',
          type: 'check_in',
          description: 'Test confirmation',
        },
      ]);

      const notifications = await service.handleOnSiteNotification(
        mockEmployee.nik,
      );
      const confirmationNotification = notifications.find((n) =>
        n.file?.includes('confirmation-attachment-url'),
      );

      expect(confirmationNotification).toBeDefined();
      expect(confirmationNotification.message).toContain('Test confirmation');
    });

    it('should handle prisma error', async () => {
      (prisma.employeeCache.findUnique as jest.Mock).mockRejectedValue(
        new Error(),
      );

      await expect(
        service.handleOnSiteNotification(mockEmployee.nik),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('handleCoordinatorNotification', () => {
    it('should return notifications for coordinator', async () => {
      const mockEmployee = { name: 'ucup', nik: '12346', area: 'Bandung' };

      const mockAttendances = [
        {
          status: 'presence',
          employee: { nik: '12345', name: 'John Doe' },
          checkIn: { time: new Date('2024-11-07T08:00:00Z') },
          overtime: { approved: false, checked: false, created_at: new Date() },
        },
        {
          status: 'absent',
          employee: { nik: '12346', name: 'Ucup' },
          checkIn: null,
          overtime: null,
        },
      ];

      const mockConfirmations = [
        {
          attendance: {
            employee: { nik: '12345', name: 'John Doe' },
            status: 'presence',
            checkIn: { time: new Date('2024-11-07T08:00:00Z') },
          },
          type: 'check_in',
          description: 'Terlambat',
          created_at: new Date('2024-11-07T09:00:00Z'),
          attachment: 'url/to/file',
        },
        {
          attendance: {
            employee: { nik: '12346', name: 'Ucup' },
            status: 'absent',
            checkIn: null,
          },
          type: 'check_in',
          description: 'Lupa presensi',
          created_at: new Date('2024-11-07T09:00:00Z'),
          attachment: 'url/to/file',
        },
      ];

      const mockPermits = [
        {
          start_date: new Date('2024-11-08'),
          duration: 2,
          reason: 'Sakit',
          employee: { nik: '12345', name: 'John Doe' },
          permission_letter: 'url/to/permit_file',
          created_at: new Date('2024-11-07T10:00:00Z'),
        },
      ];

      (prisma.employeeCache.findUnique as jest.Mock).mockResolvedValue(
        mockEmployee,
      );
      (prisma.attendance.findMany as jest.Mock).mockResolvedValue(
        mockAttendances,
      );
      (prisma.attendanceConfirmation.findMany as jest.Mock).mockResolvedValue(
        mockConfirmations,
      );
      (prisma.permit.findMany as jest.Mock).mockResolvedValue(mockPermits);

      const notifications = await service.handleCoordinatorNotification(
        mockEmployee.nik,
      );

      expect(notifications).toContainEqual({
        nik: '12345',
        name: 'John Doe',
        message: expect.any(String),
        date: expect.any(String),
        file: expect.any(String),
        action_endpoint: expect.any(String),
      });
      expect(notifications).toContainEqual({
        nik: '12346',
        name: 'Ucup',
        message: expect.any(String),
        date: expect.any(String),
        file: expect.any(String),
        action_endpoint: expect.any(String),
      });
    });

    it('should handle errors gracefully', async () => {
      (prisma.attendance.findMany as jest.Mock).mockRejectedValue(
        new Error('Database error'),
      );

      await expect(
        service.handleCoordinatorNotification('12346'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
