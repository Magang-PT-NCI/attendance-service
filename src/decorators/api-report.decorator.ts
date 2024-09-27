import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ServerErrorResBody } from '../dto/api-error.dto';
import { ReportResBody } from '../dto/monitoring.dto';

export const ApiReport = (): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: 'get report',
      description: 'get report of attendance data',
    }),
    ApiResponse({
      status: 200,
      description: 'success get report',
      type: [ReportResBody],
    }),
    ApiResponse({
      status: 500,
      description: 'an unexpected error occurred',
      type: ServerErrorResBody,
    }),
  );
};
