import { config } from 'dotenv';

config();

export const TRANSPORT: string = process.env.LOGGER_TRANSPORT || 'console';
export const LEVEL: string = process.env.LOGGER_LEVEL || 'http';
