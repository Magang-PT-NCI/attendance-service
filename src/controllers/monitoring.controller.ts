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
  ConfirmationPatchResBody,
  DashboardResBody,
  OvertimePatchReqBody,
  OvertimePatchReqParam,
  OvertimePatchResBody,
  ReportQuery,
  ReportResBody,
} from '../dto/monitoring.dto';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiDashboard,
  ApiReport,
  ApiUpdateAttendanceConfirmation,
  ApiUpdateOvertime,
} from '../decorators/api-monitoring.decorator';
import { getDate, getDateString } from '../utils/date.utils';
import { BaseController } from './base.controller';

@Controller('monitoring')
@ApiTags('Monitoring')
export class MonitoringController extends BaseController {
  public constructor(private readonly service: MonitoringService) {
    super();
  }

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
      : getDate(getDateString(new Date()));
    const to: Date = query.to ? getDate(query.to) : from;

    this.logger.silly('transformed query parameters: ', {
      keyword,
      from,
      to,
    });

    return await this.service.handleReport(keyword, from, to);
  }

  @Patch('overtime/:id')
  @ApiUpdateOvertime()
  public async updateOvertime(
    @Param() param: OvertimePatchReqParam,
    @Body() body: OvertimePatchReqBody,
  ): Promise<OvertimePatchResBody> {
    this.validateUpdate(body.approved);
    const id = this.getNumberId(`${param.id}`);
    return await this.service.handleUpdateOvertime(id, body.approved);
  }

  @Patch('confirmation/:id')
  @ApiUpdateAttendanceConfirmation()
  public async updateAttendanceConfirmation(
    @Param() param: ConfirmationPatchReqParam,
    @Body() body: ConfirmationPatchReqBody,
  ): Promise<ConfirmationPatchResBody> {
    this.validateUpdate(body.approved);
    const id = this.getNumberId(`${param.id}`);
    return await this.service.handleUpdateAttendanceConfirmation(
      id,
      body.approved,
    );
  }

  private getNumberId(id: string): number {
    const result = parseInt(id);
    if (isNaN(result))
      throw new BadRequestException('id harus bertipe number!');
    return result;
  }

  private validateUpdate(approved: boolean) {
    this.logger.debug('request body: ', { approved });
    if (typeof approved !== 'boolean')
      throw new BadRequestException(
        'approved harus berisi nilai boolean yang valid!',
      );
  }
}
