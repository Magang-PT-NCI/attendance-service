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

export const ApiLogbookPatch = (): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: 'update logbook data',
      description: 'update logbook data',
    }),
    ApiToken(),
    ApiResponse({
      status: 200,
      description: 'success update logbook data',
      type: LogbookResBody,
    }),
    ApiBadRequest('activity id harus berupa angka yang valid', 'bad request'),
    ApiNotFound('logbook tidak ditemukan', 'attendance not found'),
    ApiResponse({
      status: 500,
      description: 'an unexpected error occurred',
      type: ServerErrorResBody,
    }),
  );
};
