import { APP_URL } from '../config/app.config';
import { LoggerUtil } from './logger.utils';
import { HttpException, InternalServerErrorException } from '@nestjs/common';

const SECOND = 1000;
const MINUTE = 60;
const HOUR = MINUTE * 60;
const MAX_WORKING_HOURS = 7 * HOUR;
const REQUIRED_CHECKIN_TIME = new Date('1970-01-01T07:00:00.000Z');
const START_OVERTIME = new Date('1970-01-01T15:00:00.000Z');
const END_OVERTIME = new Date('1970-01-01T18:00:00.000Z');

const calculateOvertime = (checkOut: Date) => {
  const difference = checkOut.getTime() - START_OVERTIME.getTime();
  const differenceInSeconds = difference / SECOND;
  return differenceInSeconds > 0 ? differenceInSeconds : null;
};

const createTimeMessage = (timeInSeconds: number): string => {
  const hours = Math.floor(timeInSeconds / HOUR);
  const minutes = Math.floor((timeInSeconds % HOUR) / MINUTE);
  const seconds = timeInSeconds % MINUTE;

  const timeParts = [];
  if (hours > 0) timeParts.push(`${hours} jam`);
  if (minutes > 0) timeParts.push(`${minutes} menit`);
  if (seconds > 0) timeParts.push(`${seconds} detik`);

  return timeParts.join(' ').trim();
};

export const getOvertime = (checkOut: Date): string => {
  if (!checkOut) {
    return null;
  }

  const actualCheckOut =
    checkOut.getTime() > END_OVERTIME.getTime() ? END_OVERTIME : checkOut;
  const overtime = calculateOvertime(actualCheckOut);

  return overtime ? createTimeMessage(overtime) : null;
};

export const getLate = (checkIn: Date): string => {
  if (!checkIn) {
    return null;
  }

  const difference = checkIn.getTime() - REQUIRED_CHECKIN_TIME.getTime();
  const differenceInSeconds = difference / SECOND;

  if (differenceInSeconds > 0) {
    return createTimeMessage(differenceInSeconds);
  }

  return null;
};

export const getWorkingHour = (checkIn: Date, checkOut: Date): string => {
  if (!checkIn || !checkOut) {
    return null;
  }

  const actualCheckOut =
    checkOut.getTime() > END_OVERTIME.getTime() ? END_OVERTIME : checkOut;

  const durationInSeconds =
    (actualCheckOut.getTime() - checkIn.getTime()) / SECOND;

  const workingHour =
    durationInSeconds > MAX_WORKING_HOURS
      ? MAX_WORKING_HOURS
      : durationInSeconds;
  const overtime = calculateOvertime(actualCheckOut) || 0;

  return createTimeMessage(workingHour + overtime);
};

export const getFileUrl = (
  filename: string,
  prefix: string,
  type: 'file' | 'photo' = 'photo',
) => {
  const localUrl = `${APP_URL}/files/${prefix}/${filename}`;
  const localFile = /\d{4}-\d{2}-\d{2}/;

  if (type === 'photo') {
    return localFile.test(filename)
      ? localUrl
      : `https://lh3.googleusercontent.com/d/${filename}=s220`;
  } else if (type === 'file') {
    return localFile.test(filename)
      ? localUrl
      : `https://drive.google.com/file/d/${filename}/view`;
  }

  return null;
};

export const handleError = (error: Error, logger: LoggerUtil) => {
  if (error instanceof HttpException) {
    throw error;
  }

  logger.error(error);
  throw new InternalServerErrorException();
};
