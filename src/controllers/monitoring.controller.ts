import { Controller, Get, Query } from '@nestjs/common';
import { MonitoringService } from '../services/monitoring.service';
import { ReportQuery, ReportResBody } from '../dto/monitoring.dto';
import { logFormat, logger } from '../utils/logger.utils';
import { DateUtils } from '../utils/date.utils';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ApiReport } from '../decorators/api-report.decorator';

@Controller('monitoring')
@ApiSecurity('jwt')
@ApiTags('Monitoring')
export class MonitoringController {
  public constructor(private readonly service: MonitoringService) {}

  @Get('dashboard')
  public async dashboard() {
    return this.service.handleDashboard();
  }

  @Get('report')
  @ApiReport()
  public async report(@Query() query: ReportQuery): Promise<ReportResBody[]> {
    logger.debug(`query parameters: ${logFormat(query)}`);

    const keyword: string = query.keyword || '';
    const from: Date = query.from
      ? DateUtils.setDate(query.from).getDate()
      : DateUtils.setDate().getDate();
    const to: Date = query.to ? DateUtils.setDate(query.to).getDate() : from;

    logger.silly(
      `transformed query parameters: ${logFormat({ keyword, from, to })}`,
    );

    return await this.service.handleReport(keyword, from, to);
  }
}
