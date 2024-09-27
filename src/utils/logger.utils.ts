import { createLogger, format } from 'winston';
import { Console, File } from 'winston/lib/winston/transports';
import { FILE_FLAG, LEVEL, TRANSPORT } from '../config/logger.config';
import { CommonUtils } from './common.utils';

const types: string[] = ['string', 'number', 'boolean'];
export const logFormat = (data: any) => {
  try {
    data = JSON.parse(data);
  } catch {}

  if (types.includes(typeof data)) {
    return data;
  }

  return JSON.stringify(data, null, 2);
};

const fileOptions = {
  filename: 'employee-service.log',
  options: { loggerFileFlag: FILE_FLAG },
};
const transports: any[] = [];

if (TRANSPORT.toLowerCase() === 'file') {
  transports.push(new File(fileOptions));
} else if (TRANSPORT.toLowerCase() === 'both') {
  transports.push(new Console({}), new File(fileOptions));
} else {
  transports.push(new Console({}));
}

export const logger = createLogger({
  level: LEVEL,
  transports,
  format: format.printf((info) => {
    const date: Date = new Date();

    const hours: string = CommonUtils.zeroPadding(date.getHours());
    const minutes: string = CommonUtils.zeroPadding(date.getMinutes());
    const seconds: string = CommonUtils.zeroPadding(date.getSeconds());
    const miliseconds: string = CommonUtils.zeroPadding(
      date.getMilliseconds(),
      3,
    );

    const time = `${hours}:${minutes}:${seconds}.${miliseconds}`;

    return `${time} [${info.level.toUpperCase()}] ${logFormat(info.message)}`;
  }),
});
