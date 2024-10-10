import { Controller, Get, Query } from '@nestjs/common';
import { MonitoringService } from '../services/monitoring.service';
import {
  DashboardResBody,
  ReportQuery,
  ReportResBody,
} from '../dto/monitoring.dto';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import {
  ApiDashboard,
  ApiReport,
} from '../decorators/api-monitoring.decorator';
import { LoggerUtil } from '../utils/logger.utils';
import { getDate } from '../utils/date.utils';

@Controller('monitoring')
@ApiSecurity('jwt')
@ApiTags('Monitoring')
export class MonitoringController {
  private readonly logger = new LoggerUtil('MonitoringController');

  public constructor(private readonly service: MonitoringService) {}

  @Get('dashboard')
  @ApiDashboard()
  public async dashboard(): Promise<DashboardResBody> {
    return this.service.handleDashboard();
  }

  @Get('report')
  @ApiReport()
  public async report(@Query() query: ReportQuery): Promise<ReportResBody[]> {
    this.logger.debug('query parameters: ', query);

    const keyword: string = query.keyword || '';
    const from: Date = query.from
      ? getDate(query.from)
      : getDate(new Date().toISOString());
    const to: Date = query.to ? getDate(query.to) : from;

    return await this.service.handleReport(keyword, from, to);
  }
}
