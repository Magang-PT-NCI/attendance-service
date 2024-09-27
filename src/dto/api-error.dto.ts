import { ApiProperty } from '@nestjs/swagger';

export class ErrorResBody {
  @ApiProperty({ description: 'error message' })
  message: string;

  @ApiProperty({ description: 'error type' })
  error: string;

  @ApiProperty({ description: 'error status code' })
  statusCode: number;
}

export class ServerErrorResBody {
  @ApiProperty({
    description: 'error message',
    example: 'Internal Server Error',
  })
  message: string;

  @ApiProperty({ description: 'error status code', example: 500 })
  statusCode: number;
}
