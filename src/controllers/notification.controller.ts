import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { NotificationService } from '../services/notification.service';
import { ApiNotification } from '../decorators/api-notification.decorator';
import { NotificationResBody } from '../dto/notification.dto';
import { BaseController } from './base.controller';

@Controller('notification')
@ApiTags('Notification')
export class NotificationController extends BaseController {
  public constructor(private readonly service: NotificationService) {
    super();
  }

  @Get('')
  @ApiNotification()
  public async notification(
    @Req() req: Request,
  ): Promise<NotificationResBody[]> {
    const nik = req.body.nik;
    const role = req.body.role;
    this.logger.debug('user data: ', { nik, role });

    if (role === 'OnSite') return this.service.handleOnSiteNotification(nik);
    return this.service.handleCoordinatorNotification();
  }
}
