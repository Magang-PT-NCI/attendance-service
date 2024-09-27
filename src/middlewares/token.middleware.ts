import {
  BadRequestException,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ApiUtils } from '../utils/api.utils';

@Injectable()
export class TokenMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.get('Authorization');

    const tokenFormat = /bearer .+/i;
    if (!tokenFormat.test(authHeader)) {
      throw new BadRequestException('token format is invalid');
    }

    const token = authHeader.split(' ')[1];

    if (!authHeader) {
      throw new BadRequestException('token is required');
    }

    const tokenValidity = await ApiUtils.verifyToken(token);

    if (!tokenValidity) {
      throw new UnauthorizedException('token is not valid');
    }

    return next();
  }
}
