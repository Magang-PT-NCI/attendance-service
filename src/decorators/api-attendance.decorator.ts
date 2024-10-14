import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import {
  AttendanceConfirmationReqBody,
  AttendanceConfirmationResBody,
  AttendancePostReqBody,
  AttendancePostResBody,
  AttendanceResBody,
  OvertimeResBody,
} from '../dto/attendance.dto';
import {
  ApiBadRequest,
  ApiConflict,
  ApiNotFound,
} from './api-response.decorator';
import { ServerErrorResBody } from '../dto/api-error.dto';
import { ApiToken } from './api-token.decorator';

export const ApiAttendance = (): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: 'get attendance',
      description: 'get attendance data for specific employee by nik',
    }),
    ApiToken(),
    ApiResponse({
      status: 200,
      description: 'success get attendance data',
      type: AttendanceResBody,
    }),
    ApiResponse({
      status: 204,
      description: 'employees have not taken attendance',
    }),
    ApiNotFound('karyawan tidak ditemukan', 'employee not found'),
    ApiResponse({
      status: 500,
      description: 'an unexpected error occurred',
      type: ServerErrorResBody,
    }),
  );
};

export const ApiPostAttendance = (): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: 'perform attendance',
      description: 'perform employee attendance for check in or check out',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({ type: AttendancePostReqBody }),
    ApiToken(),
    ApiResponse({
      status: 201,
      description: 'success perform attendance',
      type: AttendancePostResBody,
    }),
    ApiBadRequest('lokasi tidak valid', 'invalid input'),
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

export const ApiOvertime = (): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: 'request for overtime',
      description: 'request overtime for onsite',
    }),
    ApiToken(),
    ApiResponse({
      status: 201,
      description: 'success create overtime',
      type: OvertimeResBody,
    }),
    ApiBadRequest('nik harus diisi!', 'invalid input'),
    ApiNotFound('karyawan tidak ditemukan', 'not found'),
    ApiConflict(
      'konfirmasi lembur hanya dapat dilakukan pada pukul 14:00 hingga 15:00',
      'conflict error due to business logic constraints',
    ),
    ApiResponse({
      status: 500,
      description: 'an unexpected error occurred',
      type: ServerErrorResBody,
    }),
  );
};

export const ApiAttendanceConfirmation = (): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: 'attendance confirmation',
      description: 'request for attendance confirmation to coordinator',
    }),
    ApiToken(),
    ApiConsumes('multipart/form-data'),
    ApiBody({ type: AttendanceConfirmationReqBody }),
    ApiResponse({
      status: 201,
      description: 'success create attendance confirmation',
      type: AttendanceConfirmationResBody,
    }),
    ApiBadRequest('attendance_id harus diisi!', 'invalid input'),
    ApiConflict(
      'Anda masih memiliki konfirmasi yang belum diperiksa!',
      'conflict error due to business logic constraints',
    ),
    ApiResponse({
      status: 500,
      description: 'an unexpected error occurred',
      type: ServerErrorResBody,
    }),
  );
};
