import { FileService } from '../../services/file.service';
import { NotFoundException } from '@nestjs/common';
import { existsSync } from 'fs';
import { mime } from 'serve-static';

jest.mock('fs');
jest.mock('serve-static', () => ({
  mime: { lookup: jest.fn() },
}));

describe('file service test', () => {
  let service: FileService;

  beforeEach(async () => {
    service = new FileService();
  });

  it('should throw NotFoundException if the file does not exist', () => {
    (existsSync as jest.Mock).mockReturnValue(false);

    expect(() => service.handleGetFile('permit', 'file.txt')).toThrow(
      new NotFoundException('file file.txt tidak ditemukan'),
    );
  });

  it('should return file path and mimeType if the file exists', () => {
    const mockPath = './public/upload/permit/file.txt';
    (existsSync as jest.Mock).mockReturnValue(true);
    (mime.lookup as jest.Mock).mockReturnValue('text/plain');

    const result = service.handleGetFile('permit', 'file.txt');

    expect(result).toEqual({
      path: mockPath,
      mimeType: 'text/plain',
    });
    expect(existsSync).toHaveBeenCalledWith(mockPath);
    expect(mime.lookup).toHaveBeenCalledWith('file.txt');
  });

  it('should return application/octet-stream as default mimeType if mimeType is not found', () => {
    const mockPath = './public/upload/permit/file.unknown';
    (existsSync as jest.Mock).mockReturnValue(true);
    (mime.lookup as jest.Mock).mockReturnValue(undefined);

    const result = service.handleGetFile('permit', 'file.unknown');

    expect(result).toEqual({
      path: mockPath,
      mimeType: 'application/octet-stream',
    });
  });
});
