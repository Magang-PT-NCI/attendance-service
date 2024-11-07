import { PermitService } from '../../services/permit.service';
import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../services/prisma.service';
import { PermitPostReqBody, PermitResBody } from '../../dto/permit.dto';
import { getEmployee } from '../../utils/api.utils';
import { uploadFile } from '../../utils/upload.utils';
import { getDate, getDateString } from '../../utils/date.utils';

jest.mock('../../utils/api.utils');
jest.mock('../../utils/upload.utils');
jest.mock('../../services/prisma.service', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({
    attendance: { findFirst: jest.fn(), create: jest.fn(), update: jest.fn() },
    permit: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  })),
}));

describe('permit service test', () => {
  let service: PermitService;
  let prisma: PrismaService;

  beforeAll(async () => {
    prisma = new PrismaService();
    service = new PermitService(prisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handlePermit test', () => {
    const data: PermitPostReqBody = {
      nik: '123456',
      reason: 'sick',
      start_date: getDateString(new Date()),
      duration: 1,
      permission_letter: {
        originalname: 'image.png',
        mimetype: 'image/png',
        buffer: Buffer.from('test'),
      } as Express.Multer.File,
    };

    it('should throw NotFoundException if employee not found', async () => {
      (getEmployee as jest.Mock).mockResolvedValue(null);

      await expect(service.handlePermit(data)).rejects.toThrow(
        new NotFoundException('karyawan tidak ditemukan'),
      );
    });

    it('should throw ConflictException if start date and duration is invalid', async () => {
      const date = new Date();

      (data as any).start_date = getDateString(date);
      (data as any).duration = 2;

      await expect(service.handlePermit(data)).rejects.toThrow(
        new ConflictException(
          'hanya dapat mengajukan izin 1 hari untuk pengajuan izin di hari ini',
        ),
      );

      date.setDate(date.getDate() - 1);

      (data as any).start_date = getDateString(date);
      (data as any).duration = 1;

      await expect(service.handlePermit(data)).rejects.toThrow(
        new ConflictException(
          `tidak dapat melakukan permit untuk ${getDateString(date)}`,
        ),
      );

      (data as any).start_date = getDateString(new Date());
    });

    it('should throw ConflictException if there is an existing unchecked permit', async () => {
      (getEmployee as jest.Mock).mockResolvedValue({ nik: '123456' });
      (prisma.permit.findFirst as jest.Mock).mockResolvedValue({ id: 1 });

      await expect(service.handlePermit(data)).rejects.toThrow(
        new ConflictException('anda masih memiliki izin yang belum disetujui'),
      );
    });

    it('should throw ConflictException if there is a conflict attendance at specific date', async () => {
      (getEmployee as jest.Mock).mockResolvedValue({ nik: '123456' });
      (prisma.permit.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue({ id: 1 });

      await expect(service.handlePermit(data)).rejects.toThrow(
        new ConflictException(
          `karyawan telah melakukan check in atau memiliki izin yang telah disetujui pada ${data.start_date}`,
        ),
      );
    });

    it('should handle prisma error', async () => {
      (prisma.permit.findFirst as jest.Mock).mockRejectedValue(new Error());

      await expect(service.handlePermit(data)).rejects.toThrow(
        new InternalServerErrorException(),
      );
    });

    it('should create a new permit', async () => {
      (getEmployee as jest.Mock).mockResolvedValue({ nik: '123456' });
      (prisma.permit.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.attendance.findFirst as jest.Mock).mockResolvedValue(null);
      (uploadFile as jest.Mock).mockResolvedValue('filename.jpg');

      const result = {
        id: 1,
        start_date: getDate(data.start_date),
        duration: data.duration,
      };
      console.log(result);
      (prisma.permit.create as jest.Mock).mockResolvedValue(result);

      expect(await service.handlePermit(data)).toEqual(
        expect.any(PermitResBody),
      );
      expect(prisma.permit.create).toHaveBeenCalled();
    });
  });

  describe('handleUpdatePermit', () => {
    it('should throw NotFoundException if permit not found', async () => {
      (prisma.permit.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.handleUpdatePermit(1, true)).rejects.toThrow(
        new NotFoundException('data permit tidak ditemukan'),
      );
      expect(prisma.permit.findUnique).toHaveBeenCalled();
    });

    it('should handle prisma error', async () => {
      (prisma.permit.findUnique as jest.Mock).mockRejectedValue(new Error());

      await expect(service.handleUpdatePermit(1, true)).rejects.toThrow(
        new InternalServerErrorException(),
      );
    });

    it('should handle not approved permit', async () => {
      const permit = {
        id: 1,
        nik: '123456',
        start_date: new Date(),
        duration: 2,
        approved: false,
        checked: false,
      };
      (prisma.permit.findUnique as jest.Mock).mockResolvedValue(permit);
      (prisma.permit.update as jest.Mock).mockResolvedValue({
        ...permit,
        approved: false,
        checked: true,
      });

      const result = await service.handleUpdatePermit(1, false);

      expect(result).toEqual({ id: permit.id, approved: false });
      expect(prisma.permit.update).toHaveBeenCalledWith({
        where: { id: permit.id },
        data: { approved: false, checked: true },
      });
    });

    it('should update attendance if it exists for each day of the permit', async () => {
      const permit = {
        id: 1,
        nik: '123456',
        start_date: new Date(),
        duration: 2,
        approved: false,
        checked: false,
      };
      (prisma.permit.findUnique as jest.Mock).mockResolvedValue(permit);
      (prisma.permit.update as jest.Mock).mockResolvedValue({
        ...permit,
        approved: true,
        checked: true,
      });

      (prisma.attendance.findFirst as jest.Mock).mockResolvedValueOnce({
        id: 2,
      });
      (prisma.attendance.findFirst as jest.Mock).mockResolvedValueOnce(null);

      (prisma.attendance.update as jest.Mock).mockImplementation(() => {});
      (prisma.attendance.create as jest.Mock).mockImplementation(() => {});

      const result = await service.handleUpdatePermit(1, true);

      expect(result).toEqual({ id: permit.id, approved: true });
      expect(prisma.permit.update).toHaveBeenCalledWith({
        where: { id: permit.id },
        data: { approved: true, checked: true },
      });
      expect(prisma.attendance.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { permit_id: 1, status: 'permit' },
        select: { id: true },
      });
      expect(prisma.attendance.create).toHaveBeenCalledWith({
        data: {
          nik: '123456',
          permit_id: 1,
          date: expect.any(Date),
          status: 'permit',
        },
        select: { id: true },
      });
    });
  });
});
