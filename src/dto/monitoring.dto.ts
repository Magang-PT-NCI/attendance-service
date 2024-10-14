import { ApiProperty } from '@nestjs/swagger';
import { Attendance } from './attendance.dto';
import { PrismaAttendanceReport } from '../interfaces/monitoring.interfaces';

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

export class ReportResBody extends Attendance {
  @ApiProperty({ example: '123456789' })
  public readonly nik: string;

  @ApiProperty({ example: 'Ucup' })
  public readonly name: string;

  public constructor(attendance: PrismaAttendanceReport) {
    super(attendance);

    this.nik = attendance.employee.nik;
    this.name = attendance.employee.name;
  }

  public static getReport(
    attendances: PrismaAttendanceReport[],
  ): ReportResBody[] {
    const report: ReportResBody[] = [];

    attendances.forEach((attendance: PrismaAttendanceReport) => {
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

export class OvertimePatchReqParam {
  @ApiProperty({ example: 5, description: 'overtime id' })
  public readonly id: number;
}

export class OvertimePatchReqBody {
  @ApiProperty({ example: true })
  public readonly approved: boolean;
}

export class OvertimePatchResBody {
  @ApiProperty({ example: 5 })
  public readonly id: number;

  @ApiProperty({ example: true })
  public readonly approved: boolean;
}

export class ConfirmationPatchReqParam {
  @ApiProperty({ example: 5, description: 'attendance confirmation id' })
  public readonly id: number;
}

export class ConfirmationPatchReqBody {
  @ApiProperty({ example: true })
  public readonly approved: boolean;
}

export class ConfirmationPatchResBody {
  @ApiProperty({ example: 5 })
  public readonly id: number;

  @ApiProperty({ example: true })
  public readonly approved: boolean;
}
