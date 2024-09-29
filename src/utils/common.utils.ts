import { DateUtils } from './date.utils';
import { APP_URL, FILE_DESTINATION } from '../config/app.config';

export class CommonUtils {
  private static readonly MINUTE_FROM_SECOND = 60;
  private static readonly HOUR_FROM_SECONDS =
    CommonUtils.MINUTE_FROM_SECOND * 60;
  private static readonly REQUIRED_CHECKIN_TIME = new Date(
    '1970-01-01T07:00:00.000Z',
  );
  private static readonly START_OVERTIME = new Date('1970-01-01T15:00:00.000Z');

  private static createTimeMessage(timeInSeconds: number): string {
    const hours = Math.floor(timeInSeconds / CommonUtils.HOUR_FROM_SECONDS);
    const minutes = Math.floor(
      (timeInSeconds % CommonUtils.HOUR_FROM_SECONDS) /
        CommonUtils.MINUTE_FROM_SECOND,
    );
    const seconds = timeInSeconds % CommonUtils.MINUTE_FROM_SECOND;

    const timeParts = [];
    if (hours > 0) timeParts.push(`${hours} jam`);
    if (minutes > 0) timeParts.push(`${minutes} menit`);
    if (seconds > 0) timeParts.push(`${seconds} detik`);

    return timeParts.join(' ').trim();
  }

  public static zeroPadding(
    numText: string | number,
    length: number = 2,
  ): string {
    return `${numText}`.padStart(length, '0');
  }

  public static getOvertime(checkOut: Date): string {
    if (!checkOut) {
      return null;
    }

    const difference =
      checkOut.getTime() - CommonUtils.START_OVERTIME.getTime();
    const differenceInSeconds = difference / DateUtils.SECOND;

    if (differenceInSeconds > 0) {
      return CommonUtils.createTimeMessage(differenceInSeconds);
    }

    return null;
  }

  public static getLate(checkIn: Date): string {
    if (!checkIn) {
      return null;
    }

    const difference =
      checkIn.getTime() - CommonUtils.REQUIRED_CHECKIN_TIME.getTime();
    const differenceInSeconds = difference / DateUtils.SECOND;

    if (differenceInSeconds > 0) {
      return CommonUtils.createTimeMessage(differenceInSeconds);
    }

    return null;
  }

  public static getWorkingHour(checkIn: Date, checkOut: Date): string {
    if (!checkIn || !checkOut) {
      return null;
    }
    const durationInSeconds =
      (checkOut.getTime() - checkIn.getTime()) / DateUtils.SECOND;

    return CommonUtils.createTimeMessage(durationInSeconds);
  }

  public static getFileUrl(
    filename: string,
    prefix: string,
    type: 'file' | 'photo' = 'photo',
  ) {
    const localUrl = `${APP_URL}/files/${prefix}/${filename}`;

    if (type === 'photo') {
      return FILE_DESTINATION === 'local'
        ? localUrl
        : `https://lh3.googleusercontent.com/d/${filename}=s220`;
    } else if (type === 'file') {
      return FILE_DESTINATION === 'local'
        ? localUrl
        : `https://drive.google.com/file/d/${filename}/view`;
    }

    return null;
  }
}
