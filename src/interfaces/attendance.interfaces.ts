import {
  Activity,
  AttendanceConfirmation,
  AttendanceStatus,
  Check,
  EmployeeCache,
  Overtime,
  Permit,
} from '@prisma/client';

export interface Attendance {
  id?: number;
  nik?: string;
  check_in_id?: number;
  check_out_id?: number;
  permit_id?: number;
  overtime_id?: number;
  date?: Date;
  status?: AttendanceStatus;
  checkIn?: Check;
  checkOut?: Check;
  permit?: Permit;
  overtime?: Overtime;
  employee?: EmployeeCache;
  activities?: Activity[];
  confirmations?: AttendanceConfirmation[];
}

export interface CurrentDate {
  current: Date;
  currentDateIso: string;
  currentTimeIso: string;
}
