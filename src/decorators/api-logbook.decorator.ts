import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiToken } from './api-token.decorator';
import { ApiBadRequest, ApiNotFound } from './api-response.decorator';
import { ServerErrorResBody } from '../dto/api-error.dto';
import { LogbookResBody } from '../dto/logbook.dto';

export const ApiLogbookPost = (): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: 'create logbook data',
      description: 'create logbook data',
    }),
    ApiToken(),
    ApiResponse({
      status: 201,
      description: 'success create logbook data',
      type: LogbookResBody,
    }),
    ApiBadRequest('description harus diisi', 'bad request'),
    ApiNotFound('data attendance tidak ditemukan', 'attendance not found'),
    ApiResponse({
      status: 500,
      description: 'an unexpected error occurred',
      type: ServerErrorResBody,
    }),
  );
};
