import { applyDecorators } from '@nestjs/common';
import { ApiBadRequest, ApiUnauthorized } from './api-response.decorator';

export const ApiToken = (): MethodDecorator => {
  return applyDecorators(
    ApiBadRequest('token is required', 'token is required'),
    ApiUnauthorized('token tidak valid', 'invalid token'),
  );
};
