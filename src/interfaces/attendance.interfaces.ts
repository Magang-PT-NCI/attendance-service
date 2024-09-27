import { AttendanceStatus } from '@prisma/client';
import { Permit } from './permit.interfaces';
import { PrismaActivity } from './logbook.interfaces';

export type Check = {
  time: Date;
  location: string;
  photo: string;
};

export type PrismaAttendance = {
  id: number;
  date: Date;
  status: AttendanceStatus;
  checkIn: Check;
  checkOut: Check;
  activities: PrismaActivity[];
  permit: Permit;
};
