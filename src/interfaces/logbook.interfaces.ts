import { ActivityStatus } from '@prisma/client';

export type PrismaActivity = {
  id: number;
  description: string;
  status: ActivityStatus;
  start_time: Date;
  end_time: Date;
};
