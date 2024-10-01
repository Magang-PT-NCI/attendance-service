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
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { RequestPostPermit } from '../decorators/request-permit.decorator';
import {
  PermitPatchParam,
  PermitPatchReqBody,
  PermitPostReqBody,
  PermitResBody,
} from '../dto/permit.dto';
import {
  ApiPatchPermit,
  ApiPostPermit,
} from '../decorators/api-permit.decorator';
import { logFormat, logger } from '../utils/logger.utils';

@Controller('permit')
@ApiSecurity('jwt')
@ApiTags('Permit')
export class PermitController {
  constructor(private readonly service: PermitService) {}

  @Post('')
  @UseInterceptors(FileInterceptor('permission_letter'))
  @ApiPostPermit()
  async permit(
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
  async updatePermit(
    @Param() param: PermitPatchParam,
    @Body() reqBody: PermitPatchReqBody,
  ): Promise<PermitResBody> {
    logger.debug(`request body: ${logFormat(reqBody)}`);

    const id = parseInt(`${param.id}`);

    if (isNaN(id)) {
      throw new BadRequestException(
        'permit id harus berisi id berupa angka yang valid',
      );
    }

    if (typeof reqBody.approved !== 'boolean') {
      throw new BadRequestException(
        'approved harus berisi boolean true atau false',
      );
    }

    return await this.service.handleUpdatePermit(id, reqBody.approved);
  }
}
