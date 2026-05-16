import { BullModule } from '@nestjs/bull';
import { Module, OnModuleInit, Logger } from '@nestjs/common';
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
export class AnalyticsModule implements OnModuleInit {
  private readonly logger = new Logger(AnalyticsModule.name);
  onModuleInit() {
    this.logger.log('AnalyticsModule initialized');
  }
}
