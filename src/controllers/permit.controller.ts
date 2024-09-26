import { Controller, Patch, Post } from '@nestjs/common';
import { PermitService } from '../services/permit.service';

@Controller('permit')
export class PermitController {
  constructor(private readonly service: PermitService) {}

  @Post('')
  async permit() {
    return this.service.handlePermit();
  }

  @Patch(':id')
  async updatePermit() {
    return this.service.handleUpdatePermit();
  }
}
