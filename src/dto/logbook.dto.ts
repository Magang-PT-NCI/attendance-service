import { ApiProperty } from '@nestjs/swagger';
import { Activity, ActivityStatus } from '@prisma/client';
import { getTimeString } from '../utils/date.utils';

export class LogbookReqBody {
  @ApiProperty({ example: 5 })
  public readonly attendance_id: number;

  @ApiProperty({ example: 'meeting bersama client' })
  public readonly description: string;

  @ApiProperty({ example: 'done' })
  public readonly status: ActivityStatus;

  @ApiProperty({ example: '10:00' })
  public readonly start_time: string;

  @ApiProperty({ example: '11:30' })
  public readonly end_time: string;
}

export class UpdateLogbookParam {
  @ApiProperty({ example: 5, description: 'activity id' })
  public readonly activity_id: number;
}

export class UpdateLogbookReqBody {
  @ApiProperty({ example: 'meeting bersama client', required: false })
  public description?: string;

  @ApiProperty({ example: 'done', required: false })
  public status?: ActivityStatus;

  @ApiProperty({ example: '10:00', required: false })
  public start_time?: string;

  @ApiProperty({ example: '11:30', required: false })
  public end_time?: string;
}

export class LogbookResBody {
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

  public constructor(activity: Activity) {
    this.id = activity.id;
    this.description = activity.description;
    this.status = activity.status;
    this.start_time = getTimeString(activity.start_time, true);
    this.end_time = getTimeString(activity.end_time, true);
  }

  public static getActivities(prismaActivities: Activity[]): LogbookResBody[] {
    const activities: LogbookResBody[] = [];

    prismaActivities.forEach((activity: Activity) => {
      activities.push(new LogbookResBody(activity));
    });

    return activities;
  }
}
