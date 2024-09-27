import { EmployeeCache } from '@prisma/client';
import { PrismaCommonAttendance } from './attendance.interfaces';

export interface PrismaAttendanceReport extends PrismaCommonAttendance {
  employee: EmployeeCache;
}
