import { Test, TestingModule } from '@nestjs/testing';
import { FileController } from '../../controllers/file.controller';
import { FileService } from '../../services/file.service';
import { FileParams } from '../../dto/file.dto';
import { Response } from 'express';
import { createReadStream } from 'fs';

jest.mock('fs', () => ({
  createReadStream: jest.fn(),
}));

describe('file controller unit test', () => {
  let controller: FileController;
  let fileService: FileService;
  let mockResponse: Partial<Response>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileController],
      providers: [
        {
          provide: FileService,
          useValue: {
            handleGetFile: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<FileController>(FileController);
    fileService = module.get<FileService>(FileService);

    mockResponse = {
      set: jest.fn(),
      status: jest.fn(),
      send: jest.fn(),
      pipe: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should set the correct content-type and pipe the file stream', () => {
    const params: FileParams = { type: 'images', filename: 'test.jpg' };
    const path = '/mock/path/test.jpg';
    const mimeType = 'image/jpeg';
    const fileStream = { pipe: jest.fn() };

    (fileService.handleGetFile as jest.Mock).mockReturnValue({
      path,
      mimeType,
    });
    (createReadStream as jest.Mock).mockReturnValue(fileStream);

    controller.getFile(params, mockResponse as Response);

    expect(fileService.handleGetFile).toHaveBeenCalledWith(
      'images',
      'test.jpg',
    );
    expect(mockResponse.set).toHaveBeenCalledWith({
      'Content-Type': mimeType,
    });
    expect(fileStream.pipe).toHaveBeenCalledWith(mockResponse);
  });
});
