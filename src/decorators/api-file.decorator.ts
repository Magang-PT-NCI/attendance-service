import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiNotFound } from './api-response.decorator';
import { ServerErrorResBody } from '../dto/api-error.dto';

export const ApiFile = (): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: 'get static file',
      description:
        'get static file when FILE_DESTINATION at .env is set to local',
    }),
    ApiResponse({
      status: 200,
      description: 'success get file',
    }),
    ApiNotFound('file test.png tidak ditemukan', 'file name is invalid'),
    ApiResponse({
      status: 500,
      description: 'an unexpected error occurred',
      type: ServerErrorResBody,
    }),
  );
};
