import { AttendanceController } from '../../controllers/attendance.controller';
import { AttendanceService } from '../../services/attendance.service';
import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceQuery } from '../../dto/attendance.dto';
import { getDateString } from '../../utils/date.utils';

describe('attendance controller test', () => {
  let controller: AttendanceController;
  let service: AttendanceService;

  const nik = '123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendanceController],
      providers: [
        {
          provide: AttendanceService,
          useValue: {
            handleGetAttendanceByNik: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AttendanceController>(AttendanceController);
    service = module.get<AttendanceService>(AttendanceService);
  });

  it('should be call getAttendanceByNik with valid value', async () => {
    (service.handleGetAttendance as jest.Mock).mockRejectedValue(null);

    const testValueValidation = async (
      query: AttendanceQuery,
      defaultValue: boolean = false,
    ) => {
      await expect(
        controller.getAttendance(nik, {
          filter: query.filter,
          date: query.date,
        }),
      ).rejects.toBeNull();

      const filter = defaultValue ? 'all' : query.filter;
      const date = defaultValue ? getDateString(new Date()) : query.date;
      expect(service.handleGetAttendance).toHaveBeenCalledWith(
        nik,
        filter,
        date,
      );
    };

    await testValueValidation({
      filter: 'all',
      date: getDateString(new Date()),
    });
    await testValueValidation({ filter: 'done', date: '2024-01-01' });
    await testValueValidation({ filter: 'progress', date: '2024-01-02' });
    await testValueValidation({ filter: 'abc', date: 'hello' }, true);
    await testValueValidation({ filter: 'abc', date: 'hello' }, true);
    await testValueValidation({} as AttendanceQuery, true);
  });

  it('should be return attendance data', async () => {
    (service.handleGetAttendance as jest.Mock).mockReturnValue({ id: 1 });

    const result = await controller.getAttendance(nik, {} as AttendanceQuery);

    expect(result).toEqual({ id: 1 });
    expect(service.handleGetAttendance).toHaveBeenCalledWith(
      nik,
      'all',
      getDateString(new Date()),
    );
  });
});
