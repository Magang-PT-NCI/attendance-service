import { ApiProperty } from '@nestjs/swagger';

export class NotificationResBody {
  @ApiProperty({ example: '123456789' })
  public readonly nik: string;

  @ApiProperty({ example: 'Ucup' })
  public readonly name: string;

  @ApiProperty({ example: 'Mengajukan lembur hari ini.' })
  public readonly message: string;

  @ApiProperty({ example: '2024-01-01' })
  public readonly date: string;

  @ApiProperty({
    example:
      'https://drive.google.com/file/d/1xsCnECsNJfoG7FPgO9nhXH2KHCgTQ-B8/view',
    description: 'may be null',
  })
  public readonly file: string;

  @ApiProperty({
    example: '/monitoring/overtime/8',
    description: 'may be null',
  })
  public readonly action_endpoint: string;
}
