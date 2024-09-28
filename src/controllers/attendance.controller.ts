import {
  Controller,
  Get,
  NotImplementedException,
  Param,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AttendanceService } from '../services/attendance.service';
import { ApiAttendance } from '../decorators/api-attendance.decorator';
import { AttendanceQuery, AttendanceResBody } from '../dto/attendance.dto';
import { DateUtils } from '../utils/date.utils';
import { AttendanceInterceptor } from '../interceptors/attendance.interceptor';

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
  async postAttendance() {
    throw new NotImplementedException();
  }
}
