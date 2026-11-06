import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

/** Gắn x-request-id và ghi log mỗi request (method, url, status, thời gian xử lý). */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime.bigint();
    const requestId = (req.headers['x-request-id'] as string | undefined) ?? randomUUID();
    res.setHeader('x-request-id', requestId);
    res.on('finish', () => {
      const ms = Number(process.hrtime.bigint() - start) / 1e6;
      if (req.originalUrl === '/health' && res.statusCode === 200) return; // tránh spam log health check
      this.logger.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)}ms rid=${requestId}`);
    });
    next();
  }
}
