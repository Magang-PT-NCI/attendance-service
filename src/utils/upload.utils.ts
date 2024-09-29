import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { DateUtils } from './date.utils';
import { extname } from 'path';
import { logFormat, logger } from './logger.utils';

export class UploadUtil {
  public static uploadToDrive() {
    // const currentDate = getDate().dateObject;
    // const filename = `${nik}_${type}_${currentDate.getDate()}-${currentDate.getMonth() + 1}-${currentDate.getFullYear()}${path.extname(file.originalname)}`;
    // const upload = await uploadFileToDrive(file, filename);
    //
    // // upload error
    // if (!upload) {
    //   return { errorCode: 2, result };
    // }
    //
    // photo = upload.id;
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
