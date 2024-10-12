import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiToken } from './api-token.decorator';
import { ServerErrorResBody } from '../dto/api-error.dto';
import { NotificationResBody } from '../dto/notification.dto';

export const ApiNotification = (): MethodDecorator => {
  return applyDecorators(
    ApiOperation({
      summary: 'get notification',
      description: 'get notification for OnSite and Koordinator',
    }),
    ApiToken(),
    ApiResponse({
      status: 200,
      description: 'success get notification',
      type: [NotificationResBody],
    }),
    ApiResponse({
      status: 500,
      description: 'an unexpected error occurred',
      type: ServerErrorResBody,
    }),
  );
};
