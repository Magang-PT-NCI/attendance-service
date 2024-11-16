import { CronJobService } from '../../services/cron-job.service';
import { PrismaService } from '../../services/prisma.service';

describe('CronJobService', () => {
  let cronJobService: CronJobService;
  let prismaService: PrismaService;

  beforeAll(() => {
    prismaService = new PrismaService();
    cronJobService = new CronJobService(prismaService);

    jest
      .spyOn(prismaService, 'synchronizeEmployeeCache')
      .mockImplementation(async () => {});
  });

  it('should log "cron job is started" and mark employees as absent', async () => {
    jest
      .spyOn(prismaService, 'synchronizeEmployeeCache')
      .mockImplementation(async () => {});

    jest
      .spyOn(prismaService.employeeCache, 'findMany')
      .mockResolvedValue([{ nik: '123', name: 'ucup', area: 'Bandung' }]);

    const createManySpy = jest
      .spyOn(prismaService.attendance, 'createMany')
      .mockResolvedValue(null);
    const loggerInfoSpy = jest.spyOn(cronJobService['logger'], 'info');

    await cronJobService.handleCron();

    expect(loggerInfoSpy).toHaveBeenCalledWith('cron job is started');
    expect(createManySpy).toHaveBeenCalledWith({
      data: [{ nik: '123', date: expect.anything(), status: 'absent' }],
    });
  });

  it('should log an error if prisma query fails', async () => {
    const error = new Error('Database Error');

    jest
      .spyOn(prismaService.employeeCache, 'findMany')
      .mockRejectedValue(error);
    const loggerErrorSpy = jest.spyOn(cronJobService['logger'], 'error');

    await cronJobService.handleCron();

    expect(loggerErrorSpy).toHaveBeenCalledWith(error);
  });
});
