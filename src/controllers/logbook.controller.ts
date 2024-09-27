import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { LogbookService } from '../services/logbook.service';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { LogbookReqBody, LogbookResBody } from '../dto/logbook.dto';
import { logFormat, logger } from '../utils/logger.utils';
import { ActivityStatus } from '@prisma/client';
import { ApiLogbookPost } from '../decorators/api-logbook.decorator';

@Controller()
@ApiSecurity('jwt')
@ApiTags('Logbook')
export class LogbookController {
  constructor(private readonly service: LogbookService) {}

  @Post('/logbook')
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

  async getLogbook() {
    return this.service.handleGetLogbook();
  }

  async updateLogbook() {
    return this.service.handleUpdateLogbook();
  }
}
