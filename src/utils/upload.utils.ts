import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { extname } from 'path';
import {
  GOOGLE_API_KEY_FILE,
  GOOGLE_DRIVE_FOLDER_ID,
} from '../config/service.config';
import { google } from 'googleapis';
import { Readable } from 'stream';
import { getDateString } from './date.utils';
import { LoggerUtil } from './logger.utils';
import { InternalServerErrorException } from '@nestjs/common';
import { FILE_DESTINATION } from '../config/app.config';

const drive = google.drive({
  version: 'v3',
  auth: new google.auth.GoogleAuth({
    keyFile: `./${GOOGLE_API_KEY_FILE}`,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  }),
});

const uploadToDrive = async (
  file: Express.Multer.File,
  nik: string,
  type: string,
) => {
  const filename = `${nik}_${type}_${getDateString(new Date())}`;

  try {
    const fileMetadata: any = {
      name: filename,
      parents: [GOOGLE_DRIVE_FOLDER_ID],
    };

    const media = {
      mimeType: file.mimetype,
      body: Readable.from(file.buffer),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id',
    });

    return response.data.id;
  } catch (error) {
    LoggerUtil.getInstance('UploadCloudFile').error(error);
    throw new InternalServerErrorException();
  }
};

const uploadToLocal = (
  file: Express.Multer.File,
  nik: string,
  type: string,
) => {
  const folderName = `./public/upload/${type}/`;

  if (!existsSync(folderName)) {
    mkdirSync(folderName, { recursive: true });
  }

  const filename = `${nik}_${getDateString(new Date())}${extname(file.originalname)}`;

  try {
    writeFileSync(folderName + filename, file.buffer);
    return filename;
  } catch (error) {
    LoggerUtil.getInstance('UploadLocalFile').error(error);
    throw new InternalServerErrorException();
  }
};

export const uploadFile = async (
  file: Express.Multer.File,
  nik: string,
  type: string,
): Promise<string> => {
  if (FILE_DESTINATION === 'cloud') {
    return await uploadToDrive(file, nik, type);
  } else {
    return uploadToLocal(file, nik, type);
  }
};
