import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AttendanceService } from '../services/attendance.service';
import {
  ApiAttendance,
  ApiAttendanceConfirmation,
  ApiOvertime,
  ApiPostAttendance,
} from '../decorators/api-attendance.decorator';
import {
  AttendanceQuery,
  AttendancePostReqBody,
  AttendanceResBody,
  OvertimeReqBody,
  OvertimeResBody,
  AttendanceParam,
  AttendanceConfirmationResBody,
  AttendanceConfirmationReqBody,
  AttendancePostResBody,
} from '../dto/attendance.dto';
import { AttendanceInterceptor } from '../interceptors/attendance.interceptor';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  RequestAttendanceConfirmation,
  RequestPostAttendance,
} from '../decorators/request-attendance.decorator';
import { extname as pathExtname } from 'path';
import * as sharp from 'sharp';
import { getDateString } from '../utils/date.utils';
import { getEmployee } from '../utils/api.utils';
import { BaseController } from './base.controller';

@Controller('attendance')
@ApiTags('Attendance')
export class AttendanceController extends BaseController {
  public constructor(private readonly service: AttendanceService) {
    super();
  }

  @Get(':nik')
  @ApiAttendance()
  @UseInterceptors(AttendanceInterceptor)
  public async getAttendance(
    @Param() param: AttendanceParam,
    @Query() query: AttendanceQuery,
  ): Promise<AttendanceResBody> {
    this.logger.debug('query parameters: ', query);
    let filter = query.filter?.toLowerCase();
    let date = query.date;

    const validFilter = ['all', 'done', 'progress'];
    if (!filter || !validFilter.includes(filter)) {
      filter = 'all';
    }

    const validDate =
      /^(19[7-9]\d|20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
    if (!RegExp(validDate).exec(date)) {
      date = getDateString(new Date());
    }

    const attendance = await this.service.handleGetAttendance(
      param.nik,
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
  public async postAttendance(
    @RequestPostAttendance() body: AttendancePostReqBody,
  ): Promise<AttendancePostResBody> {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(body.photo.mimetype);
    const extname = filetypes.test(
      pathExtname(body.photo.originalname).toLowerCase(),
    );

    if (!mimetype || !extname) {
      throw new BadRequestException(
        'photo harus berisi gambar yang valid (png, jpg, jpeg)',
      );
    }

    let isValidImage = true;

    try {
      const image = sharp(body.photo.buffer);
      const metadata = await image.metadata();

      if (metadata.width !== metadata.height) {
        isValidImage = false;
      }
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException();
    }

    if (!isValidImage) {
      throw new BadRequestException('photo harus gambar dengan rasio 1:1');
    }

    if (!(await getEmployee(body.nik))) {
      throw new NotFoundException('karyawan tidak ditemukan');
    }

    if (body.type === 'check_in') {
      return await this.service.handleCheckIn(body);
    } else if (body.type === 'check_out') {
      return await this.service.handleCheckOut(body);
    } else {
      throw new BadRequestException('type tidak valid');
    }
  }

  @Post('overtime')
  @ApiOvertime()
  public async overtime(
    @Body() body: OvertimeReqBody,
  ): Promise<OvertimeResBody> {
    this.logger.debug('request body: ', body);

    if (!body.nik) throw new BadRequestException('nik harus diisi!');
    return await this.service.handleOvertime(body.nik);
  }

  @Post('confirmation')
  @UseInterceptors(FileInterceptor('attachment'))
  @ApiAttendanceConfirmation()
  public async attendanceConfirmation(
    @RequestAttendanceConfirmation() body: AttendanceConfirmationReqBody,
  ): Promise<AttendanceConfirmationResBody> {
    const validType = ['check_in', 'check_out', 'permit'];
    if (!validType.includes(body.type))
      throw new BadRequestException('type tidak valid!');

    if (body.type === 'permit') {
      if (!body.reason) throw new BadRequestException('reason harus diisi!');

      const validReason = [
        'sakit',
        'urusan_mendadak',
        'cuti',
        'duka',
        'melahirkan',
        'lainnya',
      ];
      if (!validReason.includes(body.reason))
        throw new BadRequestException('reason tidak valid!');
    } else {
      body.reason = undefined;
    }

    return this.service.handleAttendanceConfirmation(body);
  }
}
