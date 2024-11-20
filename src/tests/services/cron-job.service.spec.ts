import { CronJobService } from '../../services/cron-job.service';
import { PrismaService } from '../../services/prisma.service';
import * as DateUtils from '../../utils/date.utils';

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

  it('should log call handleCron correctly', async () => {
    jest
      .spyOn(prismaService, 'synchronizeEmployeeCache')
      .mockImplementation(async () => {});

    jest
      .spyOn(prismaService.employeeCache, 'findMany')
      .mockResolvedValue([{ nik: '123', name: 'ucup', area: 'Bandung' }]);

    jest.spyOn(DateUtils, 'getTimeString').mockReturnValue('07:00');
    const loggerInfoSpy = jest.spyOn(cronJobService['logger'], 'info');
    await cronJobService.handleCron();
    expect(loggerInfoSpy).toHaveBeenCalledWith('cron job is started');

    jest.spyOn(DateUtils, 'getTimeString').mockReturnValue('10:00');
    await cronJobService.handleCron();
    expect(loggerInfoSpy).toHaveBeenCalledWith('cron job is started');
  });

  it('should log an error if prisma query fails', async () => {
    const error = new Error('Database Error');

    jest
      .spyOn(prismaService.employeeCache, 'findMany')
      .mockRejectedValue(error);
    jest.spyOn(prismaService.attendance, 'deleteMany').mockRejectedValue(error);

    const loggerErrorSpy = jest.spyOn(cronJobService['logger'], 'error');

    await cronJobService.handleCron();

    expect(loggerErrorSpy).toHaveBeenCalledWith(error);
  });
});
