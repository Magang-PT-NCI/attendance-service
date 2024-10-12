import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { LoggerUtil } from '../utils/logger.utils';
import { NotificationService } from '../services/notification.service';
import { ApiNotification } from '../decorators/api-notification.decorator';
import { NotificationResBody } from '../dto/notification.dto';

@Controller('notification')
@ApiSecurity('jwt')
@ApiTags('Notification')
export class NotificationController {
  private readonly logger = new LoggerUtil('NotificationController');

  public constructor(private readonly service: NotificationService) {}

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
