import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
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

@Module({
  imports: [],
  controllers: [
    AttendanceController,
    LogbookController,
    MonitoringController,
    PermitController,
  ],
  providers: [
    AttendanceService,
    LogbookService,
    MonitoringService,
    PermitService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(HttpMiddleware, TokenMiddleware).forRoutes('*');
  }
}
