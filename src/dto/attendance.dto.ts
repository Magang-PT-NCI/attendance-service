import { ApiProperty } from '@nestjs/swagger';
import { LogbookResBody } from './logbook.dto';
import { PermitResBody } from './permit.dto';
import {
  Check,
  PrismaAttendance,
  PrismaCommonAttendance,
} from '../interfaces/attendance.interfaces';
import { AttendanceStatus } from '@prisma/client';
import { getDateString, getTimeString } from '../utils/date.utils';
import {
  getFileUrl,
  getLate,
  getOvertime,
  getWorkingHour,
} from '../utils/common.utils';
import { BadRequestException } from '@nestjs/common';

export class Location {
  @ApiProperty({ example: '-6.914744' })
  public readonly latitude: number;

  @ApiProperty({ example: '107.609810' })
  public readonly longitude: number;

  public constructor(location: string) {
    const [latitude, longitude] = location.split(/\s*,\s*/);
    this.latitude = parseFloat(latitude);
    this.longitude = parseFloat(longitude);
  }

  public static getLocationFromRequest(location: string | object): Location {
    let result: Location = null;

    if (typeof location === 'string')
      try {
        result = JSON.parse(location);
      } catch {
        throw new BadRequestException('lokasi tidak valid');
      }
    else result = location as Location;

    if (!result.latitude || !result.longitude)
      throw new BadRequestException('lokasi tidak valid');

    return result;
  }
}

export class AttendanceQuery {
  @ApiProperty({ example: 'done', required: false })
  public readonly filter: string;

  @ApiProperty({ example: '2024-01-01', required: false })
  public readonly date: string;
}

export class AttendancePostReqBody {
  @ApiProperty({ description: 'nomor induk karyawan' })
  public readonly nik: string;

  @ApiProperty({ description: 'presence location' })
  public readonly location: Location;

  @ApiProperty({ description: 'type of presence (`check_in` or `check_out`)' })
  public readonly type: string;

  @ApiProperty({
    description: 'presence photo',
    type: 'string',
    format: 'binary',
  })
  public readonly photo: Express.Multer.File;
}

export class AttendancePostResBody {
  @ApiProperty({ example: '123456789' })
  public readonly nik: string;

  @ApiProperty({ example: 'check_in' })
  public readonly type: string;

  @ApiProperty({ example: '2024-01-01' })
  public readonly date: string;

  @ApiProperty({ example: '06:35' })
  public readonly time: string;

  @ApiProperty({
    example:
      'https://lh3.googleusercontent.com/d/17ZxckunTexIjn_j_Vve2CKTyH98hu0aY=s220',
  })
  public readonly photo: string;

  @ApiProperty()
  public readonly location: Location;

  public constructor(
    reqBody: AttendancePostReqBody,
    filename: string,
    date: Date,
  ) {
    this.nik = reqBody.nik;
    this.location = reqBody.location;
    this.type = reqBody.type;
    this.date = getDateString(date);
    this.time = getTimeString(date);
    this.photo = getFileUrl(filename, reqBody.type);
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

  public constructor(check: Check, type: 'in' | 'out') {
    this.time = getTimeString(check.time, true);
    this.photo = getFileUrl(check.photo, `check_${type}`);
    this.location = new Location(check.location);
  }
}

export class Attendance {
  @ApiProperty({ example: 10 })
  public readonly id: number;

  @ApiProperty({ example: '2024-01-01' })
  public readonly date: string;

  @ApiProperty({ example: 'presence' })
  public readonly status: AttendanceStatus;

  @ApiProperty({ description: 'may be null', example: '2 jam 5 menit' })
  public readonly overtime: string;

  @ApiProperty({ description: 'may be null', example: '20 menit 3 detik' })
  public readonly late: string;

  @ApiProperty({ description: 'may be null', example: '7 jam 34 detik' })
  public readonly working_hours: string;

  public constructor(attendance: PrismaCommonAttendance) {
    this.id = attendance.id;
    this.date = getDateString(attendance.date);
    this.status = attendance.status;

    const checkIn = attendance.checkIn?.time;
    const checkOut = attendance.checkOut?.time;

    this.overtime = getOvertime(checkOut);
    this.late = getLate(checkIn);
    this.working_hours = getWorkingHour(checkIn, checkOut);
  }
}

export class AttendanceResBody extends Attendance {
  @ApiProperty({ description: 'may be null' })
  public readonly checkIn: AttendanceCheck;

  @ApiProperty({ description: 'may be null' })
  public readonly checkOut: AttendanceCheck;

  @ApiProperty({ description: 'may be null' })
  public readonly permit: PermitResBody;

  @ApiProperty({
    description: 'may be null',
    type: LogbookResBody,
    isArray: true,
  })
  public readonly activities: LogbookResBody[];

  public constructor(attendance: PrismaAttendance) {
    super(attendance);

    this.checkIn = attendance.checkIn
      ? new AttendanceCheck(attendance.checkIn, 'in')
      : null;
    this.checkOut = attendance.checkOut
      ? new AttendanceCheck(attendance.checkOut, 'out')
      : null;
    this.permit = attendance.permit
      ? new PermitResBody(attendance.permit)
      : null;
    this.activities = LogbookResBody.getActivities(attendance.activities);
  }
}

export class OvertimeReqBody {
  @ApiProperty({ example: '123456789' })
  public readonly nik: string;


}

export class OvertimeResBody {
  public readonly
}
