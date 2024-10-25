import { ApiProperty } from '@nestjs/swagger';

export class FileParams {
  @ApiProperty({
    example: 'check_in',
    description: '`check_in` | `check_out` | `permit`',
  })
  public readonly type: string;

  @ApiProperty({ example: 'default.jpg' })
  public readonly filename: string;
}
