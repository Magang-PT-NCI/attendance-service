import { MonitoringService } from '../../services/monitoring.service';
import { getPrismaClient } from '../../utils/prisma.utils';
import { InternalServerErrorException } from '@nestjs/common';
import { logger } from '../../utils/logger.utils';
import { ReportResBody } from '../../dto/monitoring.dto';

jest.mock('../../utils/prisma.utils');
jest.mock('../../utils/logger.utils');

describe('monitoring service test', () => {
  let service: MonitoringService;
  const keyword = 'ucup';
  const from = new Date('2024-09-01');
  const to = new Date('2024-09-07');
  const prismaMock = {
    attendance: { findMany: jest.fn() },
  };

  beforeEach(() => {
    (getPrismaClient as jest.Mock).mockReturnValue(prismaMock);

    service = new MonitoringService();
  });

  it('should return a report when data is found', async () => {
    const mockAttendance = [
      {
        employee: { nik: '123456789', name: 'ucup' },
        checkIn: { time: '06:59' },
        checkOut: { time: '13:59' },
      },
    ];
    const mockReportResBody = [
      {
        nik: '123456789',
        name: 'Ucup',
        status: 'presence',
        id: 1,
        date: '2024-09-01',
        overtime: null,
        late: null,
        working_hours: '7 jam',
      },
    ] as ReportResBody[];

    prismaMock.attendance.findMany.mockReturnValue(mockAttendance);
    jest.spyOn(ReportResBody, 'getReport').mockReturnValue(mockReportResBody);

    const result = await service.handleReport(keyword, from, to);

    expect(result).toEqual(mockReportResBody);
    expect(prismaMock.attendance.findMany).toHaveBeenCalled();
  });

  it('should throw an InternalServerErrorException if the prisma query fails', async () => {
    const keyword = 'ucup';
    const from = new Date('2023-01-01');
    const to = new Date('2023-12-31');

    prismaMock.attendance.findMany.mockRejectedValue(
      new Error('Database error'),
    );

    await expect(service.handleReport(keyword, from, to)).rejects.toThrow(
      new InternalServerErrorException(),
    );
    expect(logger.error).toHaveBeenCalled();
  });
});
