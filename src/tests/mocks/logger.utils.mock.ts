import './logger.mock';
import { LoggerUtil } from '../../utils/logger.utils';

jest.mock('../../utils/logger.utils');

export const loggerUtil = new LoggerUtil('TestClass');
export const getInstance = (
  LoggerUtil.getInstance as jest.Mock
).mockReturnValue(loggerUtil);

export const debug = jest.spyOn(loggerUtil, 'debug');
export const silly = jest.spyOn(loggerUtil, 'silly');
export const http = jest.spyOn(loggerUtil, 'http');
export const info = jest.spyOn(loggerUtil, 'info');
export const error = jest.spyOn(loggerUtil, 'error');
