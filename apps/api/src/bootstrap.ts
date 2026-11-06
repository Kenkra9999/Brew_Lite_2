import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { DomainExceptionFilter } from './common/domain-exception.filter';

/** Cấu hình dùng chung cho main.ts và integration test (đảm bảo test chạy đúng pipeline thật). */
export function configureApp(app: INestApplication, opts: { corsOrigin?: string; swagger?: boolean } = {}) {
  app.use(helmet());
  app.enableCors({
    origin: (opts.corsOrigin ?? 'http://localhost:3000').split(',').map((s) => s.trim()),
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Request-Id'],
    exposedHeaders: ['Idempotent-Replayed', 'X-Request-Id'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: false,
    }),
  );
  app.useGlobalFilters(new DomainExceptionFilter());
  app.enableShutdownHooks();

  if (opts.swagger) {
    const doc = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('BrewLite API')
        .setDescription('REST API đặt cà phê không dùng tiền mặt')
        .setVersion(process.env.APP_VERSION ?? 'dev')
        .addBearerAuth()
        .build(),
    );
    SwaggerModule.setup('docs', app, doc);
  }
  return app;
}
