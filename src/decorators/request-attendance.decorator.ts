import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { Request } from 'express';
import { AttendancePostReqBody } from '../dto/attendance.dto';
import { logFormat, logger } from '../utils/logger.utils';

export const RequestPostAttendance = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();

    logger.debug(
      `request body: ${logFormat({ ...request.body, photo: request.file.originalname })}`,
    );

    const reqBody: AttendancePostReqBody = {
      nik: request.body.nik,
      type: request.body.type,
      location: request.body.location,
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
