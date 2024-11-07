import { error } from '../mocks/logger.utils.mock';
import { uploadFile } from '../../utils/upload.utils';
import { google } from 'googleapis';
import { InternalServerErrorException } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { FILE_DESTINATION } from '../../config/app.config';
import { GOOGLE_DRIVE_FOLDER_ID } from '../../config/service.config';
import { getDateString } from '../../utils/date.utils';
import { existsSync, mkdirSync, writeFileSync } from 'fs';

jest.mock('googleapis', () => ({
  google: {
    drive: jest.fn().mockReturnValue({ files: { create: jest.fn() } }),
    auth: {
      GoogleAuth: jest.fn().mockReturnValue('AuthMock'),
    },
  },
}));
jest.mock('fs');
jest.mock('../../utils/date.utils');

describe('upload utility test', () => {
  const file: jest.Mocked<Express.Multer.File> = {
    originalname: 'image.png',
    mimetype: 'image/png',
    buffer: Buffer.from('test'),
  } as Express.Multer.File;
  const create = (google.drive as any)().files.create;
  const nik = '12345';
  const type = 'check_in';

  beforeAll(() => {
    (getDateString as jest.Mock).mockReturnValue('2024-01-01');
  });

  describe('upload to google drive', () => {
    const createParams = {
      requestBody: {
        name: '12345_check_in_2024-01-01',
        parents: [GOOGLE_DRIVE_FOLDER_ID],
      },
      media: {
        mimeType: 'image/png',
        body: expect.anything(),
      },
      fields: 'id',
    };

    beforeAll(() => {
      (FILE_DESTINATION as any) = 'cloud';
    });

    it('should throw InternalServerError when upload failed', async () => {
      const mockError = new Error('failed to upload');
      create.mockRejectedValue(mockError);

      await expect(uploadFile(file, nik, type)).rejects.toThrow(
        new InternalServerErrorException(),
      );
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining(createParams),
      );
      expect(error).toHaveBeenCalledWith(mockError);
    });

    it('should success to upload file to google drive', async () => {
      const mockId = 'abc';
      const mockUploadResponse = { data: { id: mockId } };
      create.mockReturnValue(mockUploadResponse);

      expect(await uploadFile(file, nik, type)).toBe(mockId);
      expect(create).toHaveBeenCalledWith(
        expect.objectContaining(createParams),
      );
    });
  });

  describe('upload to local', () => {
    const foldername = './public/upload/check_in/';
    const filename = `12345_2024-01-01.png`;

    beforeAll(() => {
      (FILE_DESTINATION as any) = 'local';
      (writeFileSync as jest.Mock).mockImplementation(() => {});
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should throw InternalServerError when local upload failed', async () => {
      const mockError = new Error('failed to upload');

      (writeFileSync as jest.Mock).mockImplementation(() => {
        throw mockError;
      });

      await expect(uploadFile(file, nik, type)).rejects.toThrow(
        new InternalServerErrorException(),
      );
      expect(existsSync).toHaveBeenCalledWith(foldername);
      expect(writeFileSync).toHaveBeenCalledWith(
        foldername + filename,
        file.buffer,
      );
      expect(error).toHaveBeenCalledWith(mockError);
    });

    it('should create new folder when folder path does not exist', async () => {
      (existsSync as jest.Mock).mockReturnValue(false);
      await uploadFile(file, nik, type);
      expect(existsSync).toHaveBeenCalledWith(foldername);
      expect(mkdirSync).toHaveBeenCalledWith(foldername, { recursive: true });
    });

    it('should not create new folder when folder path is exist', async () => {
      (existsSync as jest.Mock).mockReturnValue(true);
      await uploadFile(file, nik, type);
      expect(existsSync).toHaveBeenCalledWith(foldername);
      expect(mkdirSync).not.toHaveBeenCalled();
    });

    it('should return filename when upload is success', async () => {
      expect(await uploadFile(file, nik, type)).toBe(filename);
      expect(existsSync).toHaveBeenCalledWith(foldername);
      expect(writeFileSync).toHaveBeenCalledWith(
        foldername + filename,
        file.buffer,
      );
    });
  });
});
