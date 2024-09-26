import { config } from 'dotenv';

config();

export const API_KEY: string = process.env.API_KEY;
export const EMPLOYEE_SERVICE_URL: string =
  process.env.EMPLOYEE_SERVICE_URL || 'http://localhost:3001';
export const GOOGLE_API_KEY_FILE: string = process.env.GOOGLE_API_KEY_FILE;
export const GOOGLE_DRIVE_FOLDER_ID: string =
  process.env.GOOGLE_DRIVE_FOLDER_ID;
