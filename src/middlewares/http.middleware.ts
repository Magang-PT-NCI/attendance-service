import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction, Send } from 'express';
import { LoggerUtil } from '../utils/logger.utils';

@Injectable()
export class HttpMiddleware implements NestMiddleware {
  private readonly logger = new LoggerUtil('HttpMiddleware');

  public use(req: Request, res: Response, next: NextFunction): void {
    const start: number = Date.now();
    this.logger.http(`${req.method} ${req.originalUrl}`);

    const logResponse = (body: any) => {
      this.logger.debug(`response body: `, body);
    };

    // Override res.json method
    const send: Send = res.send;
    res.send = function (body: any) {
      logResponse(body);
      return send.call(this, body);
    };

    res.on('finish', () => {
      const duration: number = Date.now() - start;
      this.logger.http(
        `${req.method} ${req.originalUrl} - ${res.statusCode} ${res.statusMessage} - ${duration}ms`,
      );
    });

    res.setHeader('Content-Type', 'application/json');
    next();
  }
}
