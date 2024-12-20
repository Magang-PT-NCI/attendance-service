import { ApiProperty } from '@nestjs/swagger';
import { Attendance } from '../interfaces/attendance.interfaces';
import { getTimeString } from '../utils/date.utils';
import { AttendanceCommon } from './attendance.dto';

export class ReportQuery {
  @ApiProperty({ example: 'ucup', description: 'nik or name', required: false })
  public readonly keyword: string;

  @ApiProperty({
    example: '2024-01-01',
    description: '`YYYY-MM-DD`',
    required: false,
  })
  public readonly from: string;

  @ApiProperty({
    example: '2024-01-07',
    description: '`YYYY-MM-DD`',
    required: false,
  })
  public readonly to: string;
}

export class ReportResBody extends AttendanceCommon {
  @ApiProperty({ example: '123456789' })
  public readonly nik: string;

  @ApiProperty({ example: 'Ucup' })
  public readonly name: string;

  @ApiProperty({ example: '06:30' })
  public readonly checkInTime: string;

  @ApiProperty({ example: '14:02' })
  public readonly checkOutTime: string;

  @ApiProperty({ example: 'Tidak ada photo dan lokasi check out' })
  public readonly notes: string;

  public constructor(attendance: Attendance) {
    super(attendance);

    this.nik = attendance.employee.nik;
    this.name = attendance.employee.name;
    this.checkInTime = attendance.checkIn
      ? getTimeString(attendance.checkIn.time, true)
      : '-';
    this.checkOutTime = attendance.checkOut
      ? getTimeString(attendance.checkOut.time, true)
      : '-';
    this.notes = '';

    if (attendance.status !== 'absent' && attendance.status !== 'permit') {
      if (!attendance.checkIn?.location)
        this.notes += 'tidak ada lokasi check in\n';
      if (!attendance.checkIn?.photo)
        this.notes += 'tidak ada photo check in\n';
      if (!attendance.checkOut?.location)
        this.notes += 'tidak ada lokasi check out\n';
      if (!attendance.checkOut?.photo)
        this.notes += 'tidak ada photo check out\n';
    }

    if (this.notes === '') this.notes = '-';
  }

  public static getReport(attendances: Attendance[]): ReportResBody[] {
    const report: ReportResBody[] = [];

    attendances.forEach((attendance: Attendance) => {
      report.push(new ReportResBody(attendance));
    });

    return report;
  }
}

export class DashboardDaySummary {
  @ApiProperty({ example: 8 })
  public readonly presence: number;

  @ApiProperty({ example: 2 })
  public readonly permit: number;

  @ApiProperty({ example: 0 })
  public readonly absent: number;
}

export class DashboardWeeklySummary {
  @ApiProperty()
  public readonly monday: DashboardDaySummary;

  @ApiProperty()
  public readonly tuesday: DashboardDaySummary;

  @ApiProperty()
  public readonly wednesday: DashboardDaySummary;

  @ApiProperty()
  public readonly thursday: DashboardDaySummary;

  @ApiProperty()
  public readonly friday: DashboardDaySummary;

  @ApiProperty()
  public readonly saturday: DashboardDaySummary;
}

export class DashboardResBody {
  @ApiProperty({ example: '2024-01-01' })
  public readonly date: string;

  @ApiProperty({ example: 8 })
  public readonly total_presence: number;

  @ApiProperty({ example: 2 })
  public readonly total_permit: number;

  @ApiProperty({ example: 0 })
  public readonly total_absent: number;

  @ApiProperty()
  public readonly weekly_summary: DashboardWeeklySummary;
}

export class PatchReqParam {
  @ApiProperty({ example: 5 })
  public readonly id: number;
}

export class PatchReqBody {
  @ApiProperty({ example: '123456' })
  public readonly approval_nik: string;

  @ApiProperty({ example: true })
  public readonly approved: boolean;

  @ApiProperty({ example: 'bukti tidak cukup' })
  public readonly denied_description?: string;
}

export class PatchResBody {
  @ApiProperty({ example: 5 })
  public readonly id: number;

  @ApiProperty({ example: true })
  public readonly approved: boolean;
}
