import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { LogbookService } from '../services/logbook.service';
import { ApiTags } from '@nestjs/swagger';
import {
  LogbookReqBody,
  LogbookResBody,
  UpdateLogbookParam,
  UpdateLogbookReqBody,
} from '../dto/logbook.dto';
import { ActivityStatus } from '@prisma/client';
import {
  ApiLogbookPatch,
  ApiLogbookPost,
} from '../decorators/api-logbook.decorator';
import { getDate, isValidTime } from '../utils/date.utils';
import { BaseController } from './base.controller';

@Controller('logbook')
@ApiTags('Logbook')
export class LogbookController extends BaseController {
  public constructor(private readonly service: LogbookService) {
    super();
  }

  @Post('')
  @ApiLogbookPost()
  public async postLogbook(
    @Body() body: LogbookReqBody,
  ): Promise<LogbookResBody> {
    const data: LogbookReqBody = {
      attendance_id: body.attendance_id,
      description: body.description,
      status: body.status?.toLowerCase() as ActivityStatus,
      start_time: body.start_time,
      end_time: body.end_time,
    };

    this.logger.debug('request body: ', data);

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
  public async updateLogbook(
    @Param() params: UpdateLogbookParam,
    @Body() body: UpdateLogbookReqBody,
  ): Promise<LogbookResBody> {
    this.logger.debug('request body: ', body);

    const activityId = parseInt(`${params.activity_id}`);

    if (!activityId && activityId !== 0) {
      throw new BadRequestException(
        'activity id harus berupa angka yang valid',
      );
    }

    const data: UpdateLogbookReqBody = {};

    if (body.description) {
      data.description = body.description;
    }

    if (body.status) {
      data.status = body.status.toLowerCase() as ActivityStatus;

      if (data.status !== 'progress' && data.status !== 'done') {
        throw new BadRequestException(`status ${data.status} tidak valid`);
      }
    }

    if (body.start_time) {
      if (!isValidTime(body.start_time)) {
        throw new BadRequestException(
          'start_time harus berupa waktu yang valid dengan format HH:MM',
        );
      }

      data.start_time = getDate(body.start_time).toISOString();
    }

    if (body.end_time) {
      if (!isValidTime(body.end_time)) {
        throw new BadRequestException(
          'end_time harus berupa waktu yang valid dengan format HH:MM',
        );
      }

      data.end_time = getDate(body.end_time).toISOString();
    }

    return await this.service.handleUpdateLogbook(activityId, data);
  }
}
