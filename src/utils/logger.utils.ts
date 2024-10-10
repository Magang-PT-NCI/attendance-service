import { createLogger, format, Logger } from 'winston';
import {
  Console,
  ConsoleTransportInstance,
} from 'winston/lib/winston/transports';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { LEVEL, TRANSPORT } from '../config/logger.config';
import { getLogDateFormat } from './date.utils';

export class LoggerUtil {
  private static logger: Logger;
  private static instance: LoggerUtil;

  public constructor(private classname: string) {}

  static {
    const transports: (ConsoleTransportInstance | DailyRotateFile)[] = [];

    const createFileTransport: () => DailyRotateFile = () =>
      new DailyRotateFile({
        filename: 'employee-service-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '14d',
      });

    if (TRANSPORT.toLowerCase() === 'file') {
      transports.push(createFileTransport());
    } else if (TRANSPORT.toLowerCase() === 'both') {
      transports.push(new Console({}), createFileTransport());
    } else {
      transports.push(new Console({}));
    }

    LoggerUtil.logger = createLogger({
      level: LEVEL,
      transports,
      format: format.printf(({ message, level, classname }) => {
        const date: Date = new Date();
        const time = getLogDateFormat(date);

        return `${time} - ${level.toUpperCase()} [${classname}] ${message}`;
      }),
    });

    LoggerUtil.instance = new LoggerUtil('GlobalLogger');
  }

  public static getInstance(classname: string): LoggerUtil {
    LoggerUtil.instance.classname = classname;
    return LoggerUtil.instance;
  }

  public debug(message: string, dataObject?: object | string) {
    const data: string = dataObject ? this.logFormat(dataObject) : '';
    LoggerUtil.logger.debug(`${message}${data}`, {
      classname: this.classname,
    });
  }

  public silly(message: string, dataObject?: object | string) {
    const data: string = dataObject ? this.logFormat(dataObject) : '';
    LoggerUtil.logger.silly(`${message}${data}`, {
      classname: this.classname,
    });
  }

  public info(message: string) {
    LoggerUtil.logger.info(message, { classname: this.classname });
  }

  public http(message: string) {
    LoggerUtil.logger.http(message, { classname: this.classname });
  }

  public error(error: Error) {
    LoggerUtil.logger.error(error.stack, { classname: this.classname });
  }

  private logFormat(data: object | string): string {
    try {
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
    } catch {
      return data as string;
    }

    return JSON.stringify(data, null, 2);
  }
}
