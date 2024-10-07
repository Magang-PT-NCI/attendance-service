import {
  BadRequestException,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/api.utils';

@Injectable()
export class TokenMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.get('Authorization');

    if (!authHeader) {
      throw new BadRequestException('token harus diisi');
    }

    const tokenFormat = /bearer .+/i;
    if (!tokenFormat.test(authHeader)) {
      throw new BadRequestException('format token tidak valid');
    }

    const token = authHeader.split(' ')[1];
    const tokenValidity = await verifyToken(token);

    if (!tokenValidity) {
      throw new UnauthorizedException('token tidak valid');
    }

    return next();
  }
}
