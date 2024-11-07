import { Test, TestingModule } from '@nestjs/testing';
import { NotificationController } from '../../controllers/notification.controller';
import { NotificationService } from '../../services/notification.service';
import { Request } from 'express';
import { NotificationResBody } from '../../dto/notification.dto';

describe('notification controller test', () => {
  let controller: NotificationController;
  let notificationService: NotificationService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationController],
      providers: [
        {
          provide: NotificationService,
          useValue: {
            handleOnSiteNotification: jest.fn(),
            handleCoordinatorNotification: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<NotificationController>(NotificationController);
    notificationService = module.get<NotificationService>(NotificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const response: NotificationResBody[] = [
    {
      message: 'Coordinator Notification',
      nik: '123456',
      name: 'ucup',
      date: '2024-01-01',
      file: null,
      action_endpoint: null,
    },
  ];

  it('should call handleOnSiteNotification when role is OnSite', async () => {
    const req = { body: { nik: '12345', role: 'OnSite' } } as Request;
    (
      notificationService.handleOnSiteNotification as jest.Mock
    ).mockResolvedValue(response);

    const result = await controller.notification(req);
    expect(notificationService.handleOnSiteNotification).toHaveBeenCalledWith(
      '12345',
    );
    expect(result).toEqual(response);
  });

  it('should call handleCoordinatorNotification when role is not OnSite', async () => {
    const req = { body: { nik: '67890', role: 'Coordinator' } } as Request;
    (
      notificationService.handleCoordinatorNotification as jest.Mock
    ).mockResolvedValue(response);

    const result = await controller.notification(req);
    expect(
      notificationService.handleCoordinatorNotification,
    ).toHaveBeenCalled();
    expect(result).toEqual(response);
  });

  it('should log user data and handle OnSite notifications correctly', async () => {
    const req = { body: { nik: '12345', role: 'OnSite' } } as Request;
    const loggerSpy = jest.spyOn(controller['logger'], 'debug');

    (
      notificationService.handleOnSiteNotification as jest.Mock
    ).mockResolvedValue(response);

    await controller.notification(req);
    expect(loggerSpy).toHaveBeenCalledWith('user data: ', {
      nik: '12345',
      role: 'OnSite',
    });
    expect(notificationService.handleOnSiteNotification).toHaveBeenCalledWith(
      '12345',
    );
  });

  it('should log user data and handle Coordinator notifications correctly', async () => {
    const req = { body: { nik: '67890', role: 'Coordinator' } } as Request;
    const loggerSpy = jest.spyOn(controller['logger'], 'debug');

    (
      notificationService.handleCoordinatorNotification as jest.Mock
    ).mockResolvedValue(response);

    await controller.notification(req);
    expect(loggerSpy).toHaveBeenCalledWith('user data: ', {
      nik: '67890',
      role: 'Coordinator',
    });
    expect(
      notificationService.handleCoordinatorNotification,
    ).toHaveBeenCalled();
  });
});
