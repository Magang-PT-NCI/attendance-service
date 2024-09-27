import { getPrismaClient } from '../../utils/prisma.utils';
import { AttendanceService } from '../../services/attendance.service';
import { ApiUtils } from '../../utils/api.utils';
import { NotFoundException } from '@nestjs/common';
import { AttendanceResBody } from '../../dto/attendance.dto';

jest.mock('@prisma/client');
jest.mock('../../utils/prisma.utils');
jest.mock('../../utils/api.utils');

describe('attendance service test', () => {
  let service: AttendanceService;

  beforeEach(() => {
    const prismaMock = {
      attendance: { findFirst: jest.fn() },
    };

    (getPrismaClient as jest.Mock).mockReturnValue(prismaMock);

    service = new AttendanceService();
  });

  describe('handle get attendance test', () => {
    const nik = '123';
    const filter = 'all';
    const date = '2024-01-01';

    it('should throw NotFoundException for not existing employee', async () => {
      (ApiUtils.getEmployee as jest.Mock).mockReturnValue(null);

      await expect(
        service.handleGetAttendanceByNik(nik, filter, date),
      ).rejects.toThrow(new NotFoundException('karyawan tidak ditemukan'));
      expect(ApiUtils.getEmployee).toHaveBeenCalledWith(nik);
    });

    it('should return null for not existing attendance', async () => {
      (ApiUtils.getEmployee as jest.Mock).mockReturnValue({ nik });
      (getPrismaClient().attendance.findFirst as jest.Mock).mockReturnValue(
        null,
      );

      const result = await service.handleGetAttendanceByNik(nik, filter, date);
      expect(result).toBeNull();
      expect(ApiUtils.getEmployee).toHaveBeenCalledWith(nik);
      expect(getPrismaClient().attendance.findFirst).toHaveBeenCalled();
    });

    it('should return attendance data for existing attendance', async () => {
      const mockAttendanceData = { id: 1, status: 'presence' };
      (ApiUtils.getEmployee as jest.Mock).mockReturnValue({ nik });
      (getPrismaClient().attendance.findFirst as jest.Mock).mockReturnValue(
        mockAttendanceData,
      );

      (AttendanceResBody as jest.MockedClass<any>) = jest
        .fn()
        .mockImplementation(() => {});

      const result = await service.handleGetAttendanceByNik(nik, filter, date);
      expect(result).toBeInstanceOf(AttendanceResBody);
      expect(ApiUtils.getEmployee).toHaveBeenCalledWith(nik);
      expect(getPrismaClient().attendance.findFirst).toHaveBeenCalled();
    });
  });
});
