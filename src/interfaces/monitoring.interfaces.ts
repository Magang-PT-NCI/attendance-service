import { AttendanceStatus, EmployeeCache } from '@prisma/client';
import { PrismaCommonAttendance } from './attendance.interfaces';

export interface PrismaAttendanceReport extends PrismaCommonAttendance {
  employee: EmployeeCache;
}

export interface PrismaAttendanceDashboard {
  date: Date;
  status: AttendanceStatus;
}

export interface DaySummary {
  presence: number;
  permit: number;
  absent: number;
}
