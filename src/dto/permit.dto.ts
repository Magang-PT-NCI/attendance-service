import { ApiProperty } from '@nestjs/swagger';
import { Reason } from '@prisma/client';
import { DateUtils } from '../utils/date.utils';
import { Permit } from '../interfaces/permit.interfaces';
import { CommonUtils } from '../utils/common.utils';

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
    this.start_date = DateUtils.setDate(permit.start_date).getDateString();

    permit.start_date.setDate(permit.start_date.getDate() + 2);

    this.end_date = DateUtils.setDate(permit.start_date).getDateString();
    this.permission_letter = CommonUtils.getFileUrl(
      permit.permission_letter,
      'permit',
      'file',
    );
    this.approved = permit.approved;
  }
}
