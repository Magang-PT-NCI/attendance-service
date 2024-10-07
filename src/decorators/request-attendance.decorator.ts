import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { Request } from 'express';
import { AttendancePostReqBody, Location } from '../dto/attendance.dto';
import { LoggerUtil } from '../utils/logger.utils';

export const RequestPostAttendance = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const logger = LoggerUtil.getInstance('AttendanceController');
    const request = ctx.switchToHttp().getRequest<Request>();

    logger.debug('request body: ', {
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
