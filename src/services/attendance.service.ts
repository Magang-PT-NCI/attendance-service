import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class AttendanceService {
  async handleGetAttendanceByNik() {
    throw new NotImplementedException();
  }

  async handleGetAttendance() {
    throw new NotImplementedException();
  }

  async handleCheckIn() {
    return;
  }

  async handleCheckOut() {
    return;
  }
}
