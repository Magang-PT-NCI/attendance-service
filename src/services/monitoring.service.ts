import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class MonitoringService {
  async handleDashboard() {
    throw new NotImplementedException();
  }
}
