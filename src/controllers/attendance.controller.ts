import { Controller, Get, NotImplementedException, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AttendanceService } from '../services/attendance.service';

@Controller('attendance')
@ApiTags('Attendance')
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  @Get(':nik')
  async getAttendanceByNik() {
    return this.service.handleGetAttendanceByNik();
  }

  @Get('')
  async getAttendance() {
    return this.service.handleGetAttendance();
  }

  @Post('')
  async postAttendance() {
    throw new NotImplementedException();
  }
}
