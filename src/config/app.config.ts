import { config } from 'dotenv';

config();

const destination: string = (
  process.env.FILE_DESTINATION || 'local'
).toLowerCase();
const validDestination: string[] = ['local', 'cloud'];

export const PORT: number = parseInt(process.env.PORT) || 3002;
export const FILE_DESTINATION: string = validDestination.includes(destination)
  ? destination
  : 'local';
export const APP_URL: string = process.env.APP_URL || 'http://localhost:3002';
