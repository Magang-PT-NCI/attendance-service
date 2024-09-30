import { BadRequestException, Controller, Patch, Post, UseInterceptors } from '@nestjs/common';
import { PermitService } from '../services/permit.service';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { RequestPostPermit } from '../decorators/request-permit.decorator';
import { PermitPostReqBody } from '../dto/permit.dto';
import { ApiPostPermit } from '../decorators/api-permit.decorator';

@Controller('permit')
@ApiSecurity('jwt')
@ApiTags('Permit')
export class PermitController {
  constructor(private readonly service: PermitService) {}

  @Post('')
  @UseInterceptors(FileInterceptor('permission_letter'))
  @ApiPostPermit()
  async permit(@RequestPostPermit() body: PermitPostReqBody) {
    if (isNaN(body.duration)) {
      throw new BadRequestException('duration harus berisi angka');
    }

    if (body.duration < 1 || body.duration > 3) {
      throw new BadRequestException('duration harus diantara 1 sampai 3 hari');
    }

    return this.service.handlePermit(body);
  }

  @Patch(':id')
  async updatePermit() {
    return this.service.handleUpdatePermit();
  }
}
