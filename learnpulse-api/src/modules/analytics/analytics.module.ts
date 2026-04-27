import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { AnalyticsService } from './application/analytics.service';
import { AnalyticsController } from './presentation/analytics.controller';
import { AnalyticsProcessor } from './infrastructure/analytics.processor';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'analytics-queue' }),
  ],
  providers: [AnalyticsService, AnalyticsProcessor],
  controllers: [AnalyticsController],
})
export class AnalyticsModule {}
