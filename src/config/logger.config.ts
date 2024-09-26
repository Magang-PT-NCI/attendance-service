import { config } from 'dotenv';

config();

const validLevel: string[] = [
  'error',
  'warn',
  'info',
  'http',
  'verbose',
  'debug',
  'silly',
];

let level: string = process.env.LOGGER_LEVEL;
if (!validLevel.includes(level)) {
  level = 'http';
}

const flags: string = (
  process.env.LOGGER_FILE_FLAG || 'override'
).toLowerCase();

export const TRANSPORT: string = process.env.LOGGER_TRANSPORT || 'console';
export const LEVEL: string = level;
export const FILE_FLAG: 'a' | 'w' = flags === 'append' ? 'a' : 'w';
