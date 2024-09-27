import { ApiProperty } from '@nestjs/swagger';
import { Attendance } from './attendance.dto';

export class ReportQuery {
  @ApiProperty({ example: 'ucup', required: false })
  public readonly keyword: string;

  @ApiProperty({ example: '2024-01-01', required: false })
  public readonly from: string;

  @ApiProperty({ example: '2024-01-07', required: false })
  public readonly to: string;
}

export class ReportResBody extends Attendance {
  @ApiProperty({ example: '123456789' })
  public readonly nik: string;

  @ApiProperty({ example: 'Ucup' })
  public readonly name: string;
}
