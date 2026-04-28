import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('app.port') ?? 3000;
  const corsOrigins = configService.get<string[]>('app.corsOrigins') ?? [
    'http://localhost:3001',
  ];

  // Global API prefix
  app.setGlobalPrefix('api/v1');

  // CORS
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    credentials: true,
  });

  // Global validation pipe — validates all incoming DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // strip unknown fields
      forbidNonWhitelisted: true,
      transform: true,          // auto-transform payload types
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ─── Swagger ──────────────────────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('LearnPulse API')
    .setDescription(
      'Multi-tenant survey & training platform. ' +
      'All protected routes require `Authorization: Bearer <accessToken>`. ' +
      'Obtain a token via `POST /api/v1/auth/login`.',
    )
    .setVersion('1.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/v1/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,   // keeps the token between page reloads
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
  // ─────────────────────────────────────────────────────────────────────────

  await app.listen(port);
  console.log(`LearnPulse API running on http://localhost:${port}/api/v1`);
  console.log(`Swagger docs:        http://localhost:${port}/api/v1/docs`);
}

bootstrap();
