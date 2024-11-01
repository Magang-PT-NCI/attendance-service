import { Permit } from './permit.interfaces';
import { PrismaActivity } from './logbook.interfaces';
import { AttendanceStatus } from '@prisma/client';

export interface Check {
  time: Date;
  location: string;
  photo: string;
}

export interface PrismaAttendancePost {
  id: number;
  checkIn: { time: Date; photo: string };
  checkOut: { time: Date; photo: string };
}

export interface PrismaCommonAttendance {
  id: number;
  date: Date;
  status: AttendanceStatus;
  checkIn: Check;
  checkOut: Check;
}

export interface PrismaAttendance extends PrismaCommonAttendance {
  activities: PrismaActivity[];
  permit: Permit;
}

export interface PrismaCheckAttendance {
  id: number;
  check_out_id: number;
  overtime_id?: number;
  checkIn?: { id: number };
  activities: { id: number }[];
}

export interface CurrentDate {
  current: Date;
  currentDateIso: string;
  currentTimeIso: string;
}
