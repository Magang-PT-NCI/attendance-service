import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { DateUtils } from './date.utils';
import { extname } from 'path';
import { logFormat, logger } from './logger.utils';
import {
  GOOGLE_API_KEY_FILE,
  GOOGLE_DRIVE_FOLDER_ID,
} from '../config/service.config';
import { google } from 'googleapis';
import { Readable } from 'stream';

export class UploadUtil {
  private static async getDriveService() {
    const auth = new google.auth.GoogleAuth({
      keyFile: `./${GOOGLE_API_KEY_FILE}`,
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    });

    return google.drive({ version: 'v3', auth });
  }

  public static async uploadToDrive(
    file: Express.Multer.File,
    nik: string,
    type: string,
    dateUtil: DateUtils,
  ) {
    const filename = `${nik}_${type}_${dateUtil.getDateString()}`;

    try {
      const driveService = await this.getDriveService();
      const fileMetadata: any = {
        name: filename,
        parents: [GOOGLE_DRIVE_FOLDER_ID],
      };

      const media = {
        mimeType: file.mimetype,
        body: Readable.from(file.buffer),
      };

      const response = await driveService.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id',
      });

      if (response?.data?.id) {
        return response.data.id;
      }
    } catch (error) {
      logger.error(logFormat(error));
    }

    return null;
  }

  public static uploadToLocal(
    file: Express.Multer.File,
    nik: string,
    type: string,
    dateUtil: DateUtils,
  ) {
    const folderName = `./public/upload/${type}/`;

    if (!existsSync(folderName)) {
      mkdirSync(folderName, { recursive: true });
    }

    const filename = `${nik}_${dateUtil.getDateString()}${extname(file.originalname)}`;

    try {
      writeFileSync(folderName + filename, file.buffer);
      return filename;
    } catch (error) {
      logger.error(logFormat(error));
      return null;
    }
  }
}
