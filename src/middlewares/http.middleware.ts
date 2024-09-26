import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction, Send } from 'express';
import { logFormat, logger } from '../utils/logger.utils';

@Injectable()
export class HttpMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const start: number = Date.now();
    logger.http(`${req.method} ${req.originalUrl}`);

    // Override res.json method for
    const send: Send = res.send;
    res.send = function (body: any) {
      logger.debug(`response body: ${logFormat(body)}`);
      return send.call(this, body);
    };

    res.on('finish', () => {
      const duration: number = Date.now() - start;
      logger.http(
        `${req.method} ${req.originalUrl} - ${res.statusCode} ${res.statusMessage} - ${duration}ms`,
      );
    });

    res.setHeader('Content-Type', 'application/json');
    next();
  }
}
