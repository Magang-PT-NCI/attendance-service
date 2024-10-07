import { zeroPadding } from './common.utils';
import { IS_SHOW_DATE } from '../config/logger.config';

export const getDateString = (date: Date) => {
  const year: string = zeroPadding(date.getFullYear(), 4);
  const month: string = zeroPadding(date.getMonth() + 1, 2);
  const day: string = zeroPadding(date.getDate(), 2);

  return `${year}-${month}-${day}`;
};

export const getTimeString = (date: Date, timeFix: boolean = false) => {
  if (timeFix) {
    date.setHours(date.getHours() - 7);
  }

  const hours: string = zeroPadding(date.getHours());
  const minutes: string = zeroPadding(date.getMinutes());

  return `${hours}:${minutes}`;
};

export const getLogTimeString = (date: Date) => {
  const seconds: string = zeroPadding(date.getSeconds());
  const miliseconds: string = zeroPadding(date.getMilliseconds(), 3);

  return `${getTimeString(date)}:${seconds}.${miliseconds}`;
};

export const getLogDateFormat = (date: Date) => {
  return IS_SHOW_DATE
    ? `${getDateString(date)} ${getLogTimeString(date)}`
    : getLogTimeString(date);
};

export const isValidTime = (time: string): boolean => {
  const timeValidation = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  return timeValidation.test(time);
};

export const getDate = (dateString: string): Date => {
  if (isValidTime(dateString)) {
    return new Date(`1970-01-01T${dateString}:00.000Z`);
  }

  return new Date(dateString);
};
