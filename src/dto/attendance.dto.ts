import { AttendanceStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';
import { DateUtils } from '../utils/date.utils';
import { Activity } from './logbook.dto';
import { APP_URL, FILE_DESTINATION } from '../config/app.config';
import { PermitResBody } from './permit.dto';
import { Check, PrismaAttendance } from '../interfaces/attendance.interfaces';

export class AttendanceQuery {
  @ApiProperty({ example: 'done', required: false })
  public readonly filter: string;

  @ApiProperty({ example: '2024-01-01', required: false })
  public readonly date: string;
}

export class Location {
  @ApiProperty({ example: '-6.914744' })
  public readonly latitude: number;

  @ApiProperty({ example: '107.609810' })
  public readonly longitude: number;

  constructor(location: string) {
    const [latitude, longitude] = location.split(/\s*,\s*/);

    this.latitude = parseFloat(latitude);
    this.longitude = parseFloat(longitude);
  }
}

export class AttendanceCheck {
  @ApiProperty({ example: '07:10' })
  public readonly time: string;

  @ApiProperty({
    example:
      'https://lh3.googleusercontent.com/d/17ZxckunTexIjn_j_Vve2CKTyH98hu0aY=s220',
  })
  public readonly photo: string;

  @ApiProperty()
  public readonly location: Location;

  public constructor(check: Check) {
    this.time = DateUtils.setDate(check.time).getTimeString();
    this.photo =
      FILE_DESTINATION === 'local'
        ? `${APP_URL}/${check.photo}`
        : `https://lh3.googleusercontent.com/d/${check.photo}=s220`;
    this.location = new Location(check.location);
  }
}

export class AttendanceResBody {
  @ApiProperty({ example: 10 })
  public readonly id: number;

  @ApiProperty({ example: '2024-01-01' })
  public readonly date: string;

  @ApiProperty({ example: 'presence' })
  public readonly status: AttendanceStatus;

  @ApiProperty({ description: 'may be null' })
  public readonly checkIn: AttendanceCheck;

  @ApiProperty({ description: 'may be null' })
  public readonly checkOut: AttendanceCheck;

  @ApiProperty({ description: 'may be null' })
  public readonly permit: PermitResBody;

  @ApiProperty({ description: 'may be null', type: Activity, isArray: true })
  public readonly activities: Activity[];

  public constructor(attendance: PrismaAttendance) {
    this.id = attendance.id;
    this.date = DateUtils.setDate(attendance.date).getDateString();
    this.status = attendance.status;
    this.checkIn = attendance.checkIn
      ? new AttendanceCheck(attendance.checkIn)
      : null;
    this.checkOut = attendance.checkOut
      ? new AttendanceCheck(attendance.checkOut)
      : null;
    this.permit = attendance.permit
      ? new PermitResBody(attendance.permit)
      : null;
    this.activities = Activity.getActivities(attendance.activities);
  }
}
