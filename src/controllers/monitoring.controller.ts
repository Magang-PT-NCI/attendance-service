import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { MonitoringService } from '../services/monitoring.service';
import {
  ConfirmationPatchReqBody,
  ConfirmationPatchReqParam,
  DashboardResBody,
  OvertimePatchReqBody,
  OvertimePatchReqParam,
  OvertimePatchResBody,
  ReportQuery,
  ReportResBody,
} from '../dto/monitoring.dto';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import {
  ApiDashboard,
  ApiReport,
  ApiUpdateAttendanceConfirmation,
  ApiUpdateOvertime,
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

  @Patch('overtime/:id')
  @ApiUpdateOvertime()
  public async updateOvertime(
    @Param() param: OvertimePatchReqParam,
    @Body() { approved }: OvertimePatchReqBody,
  ): Promise<OvertimePatchResBody> {
    this.validateUpdate(approved);
    const id = this.getNumberId(`${param.id}`);
    return await this.service.handleUpdateOvertime(id, approved);
  }

  @Patch('confirmation/:id')
  @ApiUpdateAttendanceConfirmation()
  public async updateAttendanceConfirmation(
    @Param() param: ConfirmationPatchReqParam,
    @Body() { approved }: ConfirmationPatchReqBody,
  ): Promise<OvertimePatchResBody> {
    this.validateUpdate(approved);
    const id = this.getNumberId(`${param.id}`);
    return await this.service.handleUpdateAttendanceConfirmation(id, approved);
  }

  private getNumberId(id: string): number {
    const result = parseInt(id);
    if (isNaN(result))
      throw new BadRequestException('id harus bertipe number!');
    return result;
  }

  private validateUpdate(approved: boolean): void {
    this.logger.debug('request body: ', { approved });
    if (typeof approved !== 'boolean')
      throw new BadRequestException(
        'approved harus berisi nilai boolean yang valid!',
      );
  }
}
