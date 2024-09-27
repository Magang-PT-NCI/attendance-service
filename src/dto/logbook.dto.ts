import { ApiProperty } from '@nestjs/swagger';
import { ActivityStatus } from '@prisma/client';
import { DateUtils } from '../utils/date.utils';
import { PrismaActivity } from '../interfaces/logbook.interfaces';

export class Activity {
  @ApiProperty({ example: 5 })
  public readonly id: number;

  @ApiProperty({ example: 'meeting bersama client' })
  public readonly description: string;

  @ApiProperty({ example: 'progress' })
  public readonly status: ActivityStatus;

  @ApiProperty({ example: '08:00' })
  public readonly start_time: string;

  @ApiProperty({ example: '09:00' })
  public readonly end_time: string;

  public constructor(activity: PrismaActivity) {
    this.id = activity.id;
    this.description = activity.description;
    this.status = activity.status;
    this.start_time = DateUtils.setDate(activity.start_time).getTimeString();
    this.end_time = DateUtils.setDate(activity.end_time).getTimeString();
  }

  public static getActivities(prismaActivities: PrismaActivity[]): Activity[] {
    const activities: Activity[] = [];

    prismaActivities.forEach((activity: PrismaActivity) => {
      activities.push(new Activity(activity));
    });

    return activities;
  }
}
