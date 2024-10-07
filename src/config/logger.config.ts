import { config } from 'dotenv';

config();

const flags: string = (
  process.env.LOGGER_FILE_FLAG || 'override'
).toLowerCase();

export const TRANSPORT: string = process.env.LOGGER_TRANSPORT || 'console';
export const LEVEL: string = process.env.LOGGER_LEVEL || 'http';
export const FILE_FLAG: 'a' | 'w' = flags === 'append' ? 'a' : 'w';
export const DESTINATION: string =
  process.env.LOGGER_DESTINATION || 'employee-service.log';
export const IS_SHOW_DATE: boolean =
  (process.env.LOGGER_SHOW_DATE.toLowerCase() || 'false') === 'true';
