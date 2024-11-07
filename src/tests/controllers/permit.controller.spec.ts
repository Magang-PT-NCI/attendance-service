import { Test, TestingModule } from '@nestjs/testing';
import { PermitController } from '../../controllers/permit.controller';
import { PermitService } from '../../services/permit.service';
import { BadRequestException } from '@nestjs/common';

describe('permit controller test', () => {
  let controller: PermitController;
  let permitService: PermitService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PermitController],
      providers: [
        {
          provide: PermitService,
          useValue: {
            handlePermit: jest.fn(),
            handleUpdatePermit: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<PermitController>(PermitController);
    permitService = module.get<PermitService>(PermitService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('permit test', () => {
    const body = {
      duration: 2,
      reason: 'Personal',
      nik: '123456',
      start_date: '2024-01-01',
      permission_letter: {
        mimetype: 'image/jpeg',
        originalname: 'test.jpg',
        buffer: Buffer.from(''),
      } as Express.Multer.File,
    };

    const response = {
      approved: true,
      id: 1,
      reason: 'sakit',
      start_date: '2024-01-01',
      end_date: '2024-01-03',
      duration: 3,
      permission_letter: 'letter.docx',
    };

    it('should call handlePermit when duration is valid', async () => {
      (permitService.handlePermit as jest.Mock).mockResolvedValue(response);
      body.duration = 3;

      const result = await controller.permit(body);
      expect(permitService.handlePermit).toHaveBeenCalledWith(body);
      expect(result).toEqual(response);
    });

    it('should throw BadRequestException if duration is not a number', async () => {
      body.duration = 'a' as unknown as number;
      await expect(controller.permit(body)).rejects.toThrow(
        new BadRequestException('duration harus berisi angka'),
      );
    });

    it('should throw BadRequestException if duration is out of valid range', async () => {
      body.duration = 5;
      await expect(controller.permit(body)).rejects.toThrow(
        new BadRequestException('duration harus diantara 1 sampai 3 hari'),
      );
    });
  });

  describe('updatePermit test', () => {
    const param = { id: 1 };
    const body = { approved: true };
    const response = { approved: true };

    it('should call handleUpdatePermit when id and approved are valid', async () => {
      (permitService.handleUpdatePermit as jest.Mock).mockResolvedValue(
        response,
      );
      param.id = 1;
      body.approved = true;

      const result = await controller.updatePermit(param, body);
      expect(permitService.handleUpdatePermit).toHaveBeenCalledWith(1, true);
      expect(result).toEqual(response);
    });

    it('should throw BadRequestException if id is not a valid number', async () => {
      param.id = 'invalid' as unknown as number;
      body.approved = true;

      await expect(controller.updatePermit(param, body)).rejects.toThrow(
        new BadRequestException(
          'permit id harus berisi id berupa angka yang valid',
        ),
      );
    });

    it('should throw BadRequestException if approved is not a boolean', async () => {
      param.id = 1;
      body.approved = 'invalid' as unknown as boolean;

      await expect(controller.updatePermit(param, body as any)).rejects.toThrow(
        new BadRequestException(
          'approved harus berisi boolean true atau false',
        ),
      );
    });
  });
});
