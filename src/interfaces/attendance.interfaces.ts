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
  check_in_id?: number | null;
  check_out_id?: number | null;
  permit_id?: number | null;
  overtime_id?: number | null;
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
