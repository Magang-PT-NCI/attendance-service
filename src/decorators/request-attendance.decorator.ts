import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { Request } from 'express';
import {
  AttendanceConfirmationReqBody,
  AttendancePostReqBody,
  Location,
} from '../dto/attendance.dto';
import { LoggerUtil } from '../utils/logger.utils';

export const RequestPostAttendance = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();

    LoggerUtil.getInstance('AttendanceController').debug('request body: ', {
      ...request.body,
      photo: request.file?.originalname,
    });

    const reqBody: AttendancePostReqBody = {
      nik: request.body.nik,
      type: request.body.type,
      location: Location.getLocationFromRequest(request.body.location),
      photo: request.file,
    };

    // check all required fields
    for (const [field, value] of Object.entries(reqBody)) {
      if (!value && value !== 0) {
        throw new BadRequestException(`${field} harus diisi`);
      }
    }

    return reqBody;
  },
);

export const RequestAttendanceConfirmation = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const body = request.body;

    LoggerUtil.getInstance('AttendanceController').debug('request body: ', {
      ...body,
      attachment: request.file?.originalname,
    });

    const attendance_id = body.attendance_id
      ? parseInt(body.attendance_id)
      : undefined;
    if (isNaN(attendance_id)) {
      throw new BadRequestException('attendance id tidak valid!');
    }

    const requiredField: AttendanceConfirmationReqBody = {
      attendance_id,
      type: body.type?.toLowerCase(),
      description: body.description,
      attachment: request.file,
    };

    // check all required fields
    for (const [field, value] of Object.entries(requiredField)) {
      if (!value && value !== 0) {
        throw new BadRequestException(`${field} harus diisi`);
      }
    }

    return {
      ...requiredField,
      initial_time: body.initial_time,
      actual_time: body.actual_time,
      reason: body.reason,
    };
  },
);
