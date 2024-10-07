import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LoggerUtil } from '../utils/logger.utils';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new LoggerUtil('PrismaService');

  public async onModuleInit() {
    await this.$connect();
    this.logger.info('Database is connected');
  }

  public async onModuleDestroy() {
    await this.$disconnect();
    this.logger.info('Database is disconnected');
  }
}
