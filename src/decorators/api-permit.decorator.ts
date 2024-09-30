import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiToken } from './api-token.decorator';
import { ApiBadRequest, ApiConflict, ApiNotFound } from './api-response.decorator';
import { ServerErrorResBody } from '../dto/api-error.dto';
import { PermitPostReqBody, PermitResBody } from '../dto/permit.dto';

export const ApiPostPermit = (): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: 'create permit',
      description: 'create permit for employee',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({ type: PermitPostReqBody }),
    ApiToken(),
    ApiResponse({
      status: 201,
      description: 'success create permit',
      type: PermitResBody,
    }),
    ApiBadRequest('duration harus diantara 1 sampai 3 hari', 'invalid input'),
    ApiNotFound('karyawan tidak ditemukan', 'not found'),
    ApiConflict(
      'karyawan telah melakukan check in atau memiliki izin yang telah disetujui',
      'conflict error due to business logic constraints',
    ),
    ApiResponse({
      status: 500,
      description: 'an unexpected error occurred',
      type: ServerErrorResBody,
    }),
  );
};
