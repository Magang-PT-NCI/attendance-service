import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { LogbookService } from '../services/logbook.service';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import {
  LogbookReqBody,
  LogbookResBody,
  UpdateLogbookParam,
  UpdateLogbookReqBody,
} from '../dto/logbook.dto';
import { logFormat, logger } from '../utils/logger.utils';
import { ActivityStatus } from '@prisma/client';
import {
  ApiLogbookPatch,
  ApiLogbookPost,
} from '../decorators/api-logbook.decorator';
import { DateUtils } from '../utils/date.utils';

@Controller('logbook')
@ApiSecurity('jwt')
@ApiTags('Logbook')
export class LogbookController {
  constructor(private readonly service: LogbookService) {}

  @Post('')
  @ApiLogbookPost()
  async postLogbook(@Body() reqBody: LogbookReqBody): Promise<LogbookResBody> {
    const data: LogbookReqBody = {
      attendance_id: reqBody.attendance_id,
      description: reqBody.description,
      status: reqBody.status?.toLowerCase() as ActivityStatus,
      start_time: reqBody.start_time,
      end_time: reqBody.end_time,
    };

    logger.debug(`request body: ${logFormat(data)}`);

    // check all required fields
    for (const [field, value] of Object.entries(data)) {
      if (!value && value !== 0) {
        throw new BadRequestException(`${field} harus diisi`);
      }
    }

    if (data.status !== 'progress' && data.status !== 'done') {
      throw new BadRequestException(`status '${data.status}' tidak valid`);
    }

    return this.service.handlePostLogbook(data);
  }

  @Patch(':activity_id')
  @ApiLogbookPatch()
  async updateLogbook(
    @Param() params: UpdateLogbookParam,
    @Body() reqBody: UpdateLogbookReqBody,
  ): Promise<LogbookResBody> {
    logger.debug(`request body: ${logFormat(reqBody)}`);

    const activityId = parseInt(`${params.activity_id}`);

    if (!activityId && activityId !== 0) {
      throw new BadRequestException(
        'activity id harus berupa angka yang valid',
      );
    }

    const data: UpdateLogbookReqBody = {};

    if (reqBody.description) {
      data.description = reqBody.description;
    }

    if (reqBody.status) {
      data.status = reqBody.status.toLowerCase() as ActivityStatus;

      if (data.status !== 'progress' && data.status !== 'done') {
        throw new BadRequestException(`status ${data.status} tidak valid`);
      }
    }

    if (reqBody.start_time) {
      if (!DateUtils.isValidTime(reqBody.start_time)) {
        throw new BadRequestException(
          'start_time harus berupa waktu yang valid dengan format HH:MM',
        );
      }

      data.start_time = DateUtils.setDate(reqBody.start_time).getTimeIso();
    }

    if (reqBody.end_time) {
      if (!DateUtils.isValidTime(reqBody.end_time)) {
        throw new BadRequestException(
          'end_time harus berupa waktu yang valid dengan format HH:MM',
        );
      }

      data.end_time = DateUtils.setDate(reqBody.end_time).getTimeIso();
    }

    logger.silly(`optimized request body: ${logFormat(data)}`);

    return await this.service.handleUpdateLogbook(activityId, data);
  }
}
