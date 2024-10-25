import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ServerErrorResBody } from '../dto/api-error.dto';
import {
  ConfirmationPatchResBody,
  DashboardResBody,
  OvertimePatchResBody,
  ReportResBody,
} from '../dto/monitoring.dto';
import { ApiToken } from './api-token.decorator';
import { ApiBadRequest, ApiNotFound } from './api-response.decorator';

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

export const ApiUpdateOvertime = (): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: 'update overtime',
      description: 'update overtime approval status',
    }),
    ApiToken(),
    ApiResponse({
      status: 200,
      description: 'success update overtime',
      type: OvertimePatchResBody,
    }),
    ApiBadRequest(
      'approved harus berisi nilai boolean yang valid!',
      'invalid request',
    ),
    ApiNotFound('data lembur tidak ditemukan', 'overtime data not found'),
    ApiResponse({
      status: 500,
      description: 'an unexpected error occurred',
      type: ServerErrorResBody,
    }),
  );
};

export const ApiUpdateAttendanceConfirmation = (): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: 'update attendance confirmation',
      description: 'update attendance confirmation approval status',
    }),
    ApiToken(),
    ApiResponse({
      status: 200,
      description: 'success update attendance confirmation',
      type: ConfirmationPatchResBody,
    }),
    ApiBadRequest(
      'approved harus berisi nilai boolean yang valid!',
      'invalid request',
    ),
    ApiNotFound(
      'data konfirmasi kehadiran tidak ditemukan',
      'attendance confirmation data not found',
    ),
    ApiResponse({
      status: 500,
      description: 'an unexpected error occurred',
      type: ServerErrorResBody,
    }),
  );
};
