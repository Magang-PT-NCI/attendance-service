import { Controller } from '@nestjs/common';
import { LogbookService } from '../services/logbook.service';
import { ApiSecurity } from '@nestjs/swagger';

@Controller()
@ApiSecurity('jwt')
export class LogbookController {
  constructor(private readonly service: LogbookService) {}

  async postLogbook() {
    return this.service.handlePostLogbook();
  }

  async getLogbook() {
    return this.service.handleGetLogbook();
  }

  async updateLogbook() {
    return this.service.handleUpdateLogbook();
  }
}
