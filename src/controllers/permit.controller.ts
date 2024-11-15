import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { PermitService } from '../services/permit.service';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { RequestPostPermit } from '../decorators/request-permit.decorator';
import { PermitPostReqBody, PermitResBody } from '../dto/permit.dto';
import {
  ApiPatchPermit,
  ApiPostPermit,
} from '../decorators/api-permit.decorator';
import { BaseController } from './base.controller';
import {
  PatchReqBody,
  PatchReqParam,
  PatchResBody,
} from '../dto/monitoring.dto';

@Controller('permit')
@ApiTags('Permit')
export class PermitController extends BaseController {
  public constructor(private readonly service: PermitService) {
    super();
  }

  @Post('')
  @UseInterceptors(FileInterceptor('permission_letter'))
  @ApiPostPermit()
  public async permit(
    @RequestPostPermit() body: PermitPostReqBody,
  ): Promise<PermitResBody> {
    if (isNaN(body.duration)) {
      throw new BadRequestException('duration harus berisi angka');
    }

    if (body.duration < 1 || body.duration > 3) {
      throw new BadRequestException('duration harus diantara 1 sampai 3 hari');
    }

    return this.service.handlePermit(body);
  }

  @Patch(':id')
  @ApiPatchPermit()
  public async updatePermit(
    @Param() param: PatchReqParam,
    @Body() body: PatchReqBody,
  ): Promise<PatchResBody> {
    this.logger.debug('request body: ', body);

    const id = parseInt(`${param.id}`);

    if (isNaN(id)) {
      throw new BadRequestException(
        'permit id harus berisi id berupa angka yang valid',
      );
    }

    if (!body.approval_nik)
      throw new BadRequestException('approval_nik harus diisi');

    if (typeof body.approved !== 'boolean') {
      throw new BadRequestException(
        'approved harus berisi boolean true atau false',
      );
    }

    return await this.service.handleUpdatePermit(id, body);
  }
}
