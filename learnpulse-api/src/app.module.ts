import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { BullModule } from '@nestjs/bull';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';
import awsConfig from './config/aws.config';

import { PrismaModule } from './shared/prisma/prisma.module';
import { RedisModule } from './shared/redis/redis.module';
import { JwtAuthGuard } from './shared/guards/jwt-auth.guard';
import { RolesGuard } from './shared/guards/roles.guard';
import { TransformInterceptor } from './shared/interceptors/transform.interceptor';
import { GlobalExceptionFilter } from './shared/filters/http-exception.filter';

import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { UserModule } from './modules/user/user.module';
import { FormModule } from './modules/form/form.module';
import { SectionModule } from './modules/section/section.module';
import { ItemModule } from './modules/item/item.module';
import { AssignmentModule } from './modules/assignment/assignment.module';
import { ResponseModule } from './modules/response/response.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { CertificateModule } from './modules/certificate/certificate.module';
import { MediaModule } from './modules/media/media.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // Config — global, loads all env vars
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, redisConfig, awsConfig],
      envFilePath: ['.env'],
    }),

    // BullMQ — Redis-backed queues
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: configService.getOrThrow<string>('redis.url'),
      }),
    }),

    // Shared infrastructure (global providers)
    PrismaModule,
    RedisModule,

    // Application modules
    AuthModule,
    TenantModule,
    UserModule,
    FormModule,
    SectionModule,
    ItemModule,
    AssignmentModule,
    ResponseModule,
    AnalyticsModule,
    CertificateModule,
    MediaModule,
    HealthModule,
  ],
  providers: [
    // Global JWT guard — every route is protected by default
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Global Roles guard — checked after JWT
    { provide: APP_GUARD, useClass: RolesGuard },
    // Global response transformer
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    // Global exception handler
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
  ],
})
export class AppModule {}
