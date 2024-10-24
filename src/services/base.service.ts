import { Injectable } from '@nestjs/common';
import { LoggerUtil } from '../utils/logger.utils';
import { PrismaService } from './prisma.service';

@Injectable()
export abstract class BaseService {
  protected readonly logger: LoggerUtil;
  public constructor(protected readonly prisma: PrismaService) {
    this.logger = new LoggerUtil(this.constructor.name);
  }
}
