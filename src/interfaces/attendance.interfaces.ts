import { Permit } from './permit.interfaces';
import { PrismaActivity } from './logbook.interfaces';
import { AttendanceStatus } from '@prisma/client';

export interface Check {
  time: Date;
  location: string;
  photo: string;
}

export interface PrismaCommonAttendance {
  id: number;
  date: Date;
  status: AttendanceStatus;
  checkIn: { time: Date };
  checkOut: { time: Date };
}

export interface PrismaAttendance extends PrismaCommonAttendance {
  checkIn: Check;
  checkOut: Check;
  activities: PrismaActivity[];
  permit: Permit;
}

export interface PrismaAttendancePost {
  location: string,
  type: string,
  date: Date,
  time: Date,
  employee: { nik: string },
}
