import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { Request } from 'express';
import { PermitPostReqBody } from '../dto/permit.dto';
import { LoggerUtil } from '../utils/logger.utils';

export const RequestPostPermit = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const logger = LoggerUtil.getInstance('PermitController');
    const request = ctx.switchToHttp().getRequest<Request>();

    logger.debug('request body: ', {
      ...request.body,
      photo: request.file?.originalname,
    });

    const reqBody: PermitPostReqBody = {
      nik: request.body.nik,
      reason: request.body.reason?.toLowerCase(),
      start_date: request.body.start_date,
      duration: parseInt(request.body.duration),
      permission_letter: request.file,
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
