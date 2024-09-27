import { Injectable } from '@nestjs/common';

@Injectable()
export class DateUtils {
  public static readonly SECOND = 1000;
  public static readonly MINUTE = DateUtils.SECOND * 60;
  public static readonly HOUR = DateUtils.MINUTE * 60;

  private static INSTANCE: DateUtils;
  private static date: Date;

  private constructor() {}

  public static getInstance(): DateUtils {
    if (!DateUtils.INSTANCE) {
      DateUtils.INSTANCE = new DateUtils();
    }

    return DateUtils.INSTANCE;
  }

  public static isValidTime(time: string): boolean {
    const timeValidation = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
    return timeValidation.test(time);
  }

  public static setDate(date?: string | Date): DateUtils {
    const isDate: boolean = date instanceof Date;

    if (typeof date === 'string') {
      if (DateUtils.isValidTime(date)) {
        DateUtils.date = new Date(`1970-01-01T${date}:00.000Z`);
        DateUtils.date.setHours(DateUtils.date.getHours() - 7);
      } else {
        DateUtils.date = new Date(date);
      }
    } else if (isDate) {
      DateUtils.date = new Date(date);

      if (date.toISOString().startsWith('1970-01-01T')) {
        DateUtils.date.setHours(DateUtils.date.getHours() - 7);
      }
    } else {
      DateUtils.date = new Date();
    }

    return this.getInstance();
  }

  public getDateString(): string {
    const fullYear = `${DateUtils.date.getFullYear()}`.padStart(4, '0');
    const month = `${DateUtils.date.getMonth() + 1}`.padStart(2, '0');
    const date = `${DateUtils.date.getDate()}`.padStart(2, '0');

    return `${fullYear}-${month}-${date}`;
  }

  public getDateIso(): string {
    return `${this.getDateString()}T00:00:00.000Z`;
  }

  public getTimeString(): string {
    const hours = `${DateUtils.date.getHours()}`.padStart(2, '0');
    const minutes = `${DateUtils.date.getMinutes()}`.padStart(2, '0');

    return `${hours}:${minutes}`;
  }

  public getTimeIso(): string {
    return `1970-01-01T${this.getTimeString()}:00.000Z`;
  }

  public getDate(): Date {
    return DateUtils.date;
  }
}
