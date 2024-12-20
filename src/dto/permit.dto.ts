import { ApiProperty } from '@nestjs/swagger';
import { Permit, Reason } from '@prisma/client';
import { getDate, getDateString } from '../utils/date.utils';
import { getFileUrl } from '../utils/common.utils';

export class PermitResBody {
  @ApiProperty({ example: 10 })
  public readonly id: number;

  @ApiProperty({ example: 'duka' })
  public readonly reason: Reason;

  @ApiProperty({ example: '2024-01-01' })
  public readonly start_date: string;

  @ApiProperty({ example: '2024-01-03' })
  public readonly end_date: string;

  @ApiProperty({ example: 2 })
  public readonly duration: number;

  @ApiProperty({
    example:
      'https://drive.google.com/file/d/1xsCnECsNJfoG7FPgO9nhXH2KHCgTQ-B8/view',
  })
  public readonly permission_letter: string;

  @ApiProperty({ example: true })
  public readonly approved: boolean;

  public constructor(permit: Permit) {
    this.id = permit.id;
    this.reason = permit.reason;
    this.duration = permit.duration;
    this.start_date = getDateString(permit.start_date);

    let endDateCount = 0;
    const currentDate = getDate(permit.start_date.toISOString());

    for (let i = 0; i < this.duration; i++) {
      if (currentDate.getDay() === 0) {
        currentDate.setDate(currentDate.getDate() + 1);
        endDateCount++;
      }

      currentDate.setDate(currentDate.getDate() + 1);
      endDateCount++;
    }

    permit.start_date.setDate(permit.start_date.getDate() + (endDateCount - 1));

    this.end_date = getDateString(permit.start_date);
    this.permission_letter = getFileUrl(
      permit.permission_letter,
      'permit',
      'file',
    );
    this.approved = permit.approved;
  }
}

export class PermitPostReqBody {
  @ApiProperty({ description: '`123456789`' })
  public readonly nik: string;

  @ApiProperty({
    description:
      '`sakit` | `urusan_mendadak` | `cuti` | `duka` | `melahirkan` | `lainnya`',
  })
  public readonly reason: string;

  @ApiProperty({ description: '`2024-01-01`' })
  public readonly start_date: string;

  @ApiProperty({ description: '`1` | `2` | `3`' })
  public readonly duration: number;

  @ApiProperty({
    description: 'permission letter',
    type: 'string',
    format: 'buffer',
  })
  public readonly permission_letter: Express.Multer.File;
}
