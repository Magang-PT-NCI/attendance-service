import { Controller, Get, Query } from '@nestjs/common';
import { MonitoringService } from '../services/monitoring.service';
import { ReportQuery, ReportResBody } from '../dto/monitoring.dto';

@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly service: MonitoringService) {}

  async dashboard() {
    return this.service.handleDashboard();
  }

  @Get('report')
  async report(@Query() query: ReportQuery): Promise<ReportResBody> {
    console.log(query);
    return null;
  }
}
