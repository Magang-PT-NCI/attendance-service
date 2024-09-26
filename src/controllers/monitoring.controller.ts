import { Controller } from '@nestjs/common';
import { MonitoringService } from '../services/monitoring.service';

@Controller()
export class MonitoringController {
  constructor(private readonly service: MonitoringService) {}

  async dashboard() {
    return this.service.handleDashboard();
  }
}
