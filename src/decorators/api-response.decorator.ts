import { applyDecorators, HttpStatus } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ErrorResBody } from '../dto/api-error.dto';

interface ApiError {
  message: string;
  error: string;
  statusCode: number;
}

const createApiResponseDecorator = (
  status: number,
  error: string,
  description: string,
  message: string,
): MethodDecorator => {
  const example: ApiError = {
    message,
    error,
    statusCode: status,
  };

  return applyDecorators(
    ApiResponse({
      status,
      description,
      type: ErrorResBody,
      example,
    }),
  );
};

export const ApiBadRequest = (
  message: string,
  description: string = 'bad request',
): MethodDecorator =>
  createApiResponseDecorator(
    HttpStatus.BAD_REQUEST,
    'Bad Request',
    description,
    message,
  );

export const ApiUnauthorized = (
  message: string,
  description: string = 'unauthorized',
): MethodDecorator =>
  createApiResponseDecorator(
    HttpStatus.UNAUTHORIZED,
    'Unauthorized',
    description,
    message,
  );

export const ApiNotFound = (
  message: string,
  description: string = 'not found',
): MethodDecorator =>
  createApiResponseDecorator(
    HttpStatus.NOT_FOUND,
    'Not Found',
    description,
    message,
  );
