import { Reason } from '@prisma/client';

export interface Permit {
  id: number;
  nik?: string;
  reason: Reason;
  start_date: Date;
  duration: number;
  permission_letter: string;
  approved: boolean;
}
