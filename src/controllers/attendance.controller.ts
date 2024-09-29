import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AttendanceService } from '../services/attendance.service';
import {
  ApiAttendance,
  ApiPostAttendance,
} from '../decorators/api-attendance.decorator';
import {
  AttendanceQuery,
  AttendancePostReqBody,
  AttendanceResBody,
} from '../dto/attendance.dto';
import { DateUtils } from '../utils/date.utils';
import { AttendanceInterceptor } from '../interceptors/attendance.interceptor';
import { FileInterceptor } from '@nestjs/platform-express';
import { RequestPostAttendance } from '../decorators/request-attendance.decorator';
import { logFormat, logger } from '../utils/logger.utils';

@Controller('attendance')
@ApiSecurity('jwt')
@ApiTags('Attendance')
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Get(':nik')
  @ApiAttendance()
  @UseInterceptors(AttendanceInterceptor)
  async getAttendance(
    @Param('nik') nik: string,
    @Query() query: AttendanceQuery,
  ): Promise<AttendanceResBody> {
    let filter = query.filter?.toLowerCase();
    let date = query.date;

    const validFilter = ['all', 'done', 'progress'];
    if (!filter || !validFilter.includes(filter)) {
      filter = 'all';
    }

    const validDate =
      /^(19[7-9]\d|20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
    if (!RegExp(validDate).exec(date)) {
      date = DateUtils.setDate().getDateString();
    }

    const attendance = await this.service.handleGetAttendanceByNik(
      nik,
      filter,
      date,
    );

    if (!attendance) {
      return null;
    }

    return attendance;
  }

  @Post('')
  @UseInterceptors(FileInterceptor('photo'))
  @ApiPostAttendance()
  async postAttendance(@RequestPostAttendance() body: AttendancePostReqBody) {
    const reqBody = { ...body, photo: body.photo.originalname };
    logger.debug(`request body: ${logFormat(reqBody)}`);

    if (body.type === 'check_in') {
      return await this.service.handleCheckIn(body);
    } else if (body.type === 'check_out') {
      return await this.service.handleCheckOut(body);
    } else {
      throw new BadRequestException('type tidak valid');
    }
  }
}
