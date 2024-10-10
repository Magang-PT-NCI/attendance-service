import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ServerErrorResBody } from '../dto/api-error.dto';
import { DashboardResBody, ReportResBody } from '../dto/monitoring.dto';
import { ApiToken } from './api-token.decorator';

export const ApiReport = (): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: 'get report',
      description: 'get report of attendance data',
    }),
    ApiToken(),
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

export const ApiDashboard = (): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: 'get dashboard',
      description: 'get summary data for dashboard',
    }),
    ApiToken(),
    ApiResponse({
      status: 200,
      description: 'success get dashboard data',
      type: DashboardResBody,
    }),
    ApiResponse({
      status: 500,
      description: 'an unexpected error occurred',
      type: ServerErrorResBody,
    }),
  );
};
