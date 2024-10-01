import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { logFormat, logger } from '../utils/logger.utils';
import { PermitPostReqBody } from '../dto/permit.dto';

export const RequestPostPermit = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();

    logger.debug(
      `request body: ${logFormat({ ...request.body, photo: request.file?.originalname })}`,
    );

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