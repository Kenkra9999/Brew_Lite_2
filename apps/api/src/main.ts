import { ConsoleLogger, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap';

async function bootstrap() {
  const isProd = process.env.NODE_ENV === 'production';
  const app = await NestFactory.create(AppModule, {
    // Log dạng JSON ở production để nền tảng (Render) thu thập và lọc dễ dàng
    logger: new ConsoleLogger({ json: isProd, colors: !isProd, prefix: 'BrewLite' }),
  });
  const config = app.get(ConfigService);
  configureApp(app, { corsOrigin: config.get('CORS_ORIGIN'), swagger: true });
  const port = config.get<number>('PORT', 3001);
  await app.listen(port, '0.0.0.0');
  new Logger('Bootstrap').log(`BrewLite API listening on :${port} (version ${config.get('APP_VERSION')})`);
}

void bootstrap();
