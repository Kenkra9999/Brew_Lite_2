import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';

/** GET /health - dùng cho Docker HEALTHCHECK, Render health check và smoke test sau deploy. */
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  async check(@Res() res: Response) {
    const started = Date.now();
    let database: 'up' | 'down' = 'up';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'down';
    }
    const body = {
      status: database === 'up' ? 'ok' : 'error',
      version: this.config.get<string>('APP_VERSION') ?? 'dev',
      uptimeSeconds: Math.round(process.uptime()),
      checks: { database, latencyMs: Date.now() - started },
      timestamp: new Date().toISOString(),
    };
    console.log('health', body);
    res.status(database === 'up' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).json(body);
  }
}
