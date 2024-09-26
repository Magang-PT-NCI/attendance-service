import { ApiProperty } from '@nestjs/swagger';

export class ErrorResBody {
  @ApiProperty({ description: 'error message' })
  message: string;

  @ApiProperty({ description: 'error type' })
  error: string;

  @ApiProperty({ description: 'error status code' })
  statusCode: number;
}
