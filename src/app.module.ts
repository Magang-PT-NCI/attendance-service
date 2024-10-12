import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { HttpMiddleware } from './middlewares/http.middleware';
import { AttendanceController } from './controllers/attendance.controller';
import { LogbookController } from './controllers/logbook.controller';
import { MonitoringController } from './controllers/monitoring.controller';
import { PermitController } from './controllers/permit.controller';
import { AttendanceService } from './services/attendance.service';
import { LogbookService } from './services/logbook.service';
import { PermitService } from './services/permit.service';
import { MonitoringService } from './services/monitoring.service';
import { TokenMiddleware } from './middlewares/token.middleware';
import { FileController } from './controllers/file.controller';
import { FileService } from './services/file.service';
import { FILE_DESTINATION } from './config/app.config';
import { PrismaService } from './services/prisma.service';
import { CronJobService } from './services/cron-job.service';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationController } from './controllers/notification.controller';
import { NotificationService } from './services/notification.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [
    AttendanceController,
    LogbookController,
    MonitoringController,
    PermitController,
    NotificationController,
    FileController,
  ],
  providers: [
    AttendanceService,
    LogbookService,
    MonitoringService,
    PermitService,
    NotificationService,
    FileService,
    PrismaService,
    CronJobService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(HttpMiddleware).forRoutes('*');

    const tokenMiddleware = consumer.apply(TokenMiddleware);
    if (FILE_DESTINATION !== 'cloud')
      tokenMiddleware.exclude({
        path: '/files/:type/:filename',
        method: RequestMethod.GET,
      });
    tokenMiddleware.forRoutes('*');
  }
}
