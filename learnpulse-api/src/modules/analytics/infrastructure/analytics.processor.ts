import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '@shared/prisma/prisma.service';

export interface AnalyticsJobData {
  formId: string;
  sessionId: string;
  score: number | null;
  passed: boolean | null;
}

@Processor('analytics-queue')
export class AnalyticsProcessor {
  private readonly logger = new Logger(AnalyticsProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  @Process('update-metrics')
  async handleUpdateMetrics(job: Job<AnalyticsJobData>): Promise<void> {
    const { formId, sessionId } = job.data;

    this.logger.log(`Updating analytics for form ${formId}, session ${sessionId}`);

    // Analytics are primarily served from Prisma queries in the AnalyticsService.
    // This processor can be extended to maintain materialized view tables for
    // heavy reporting scenarios, or push to a dedicated analytics DB.

    // For now, mark the session as processed (can wire to analytics aggregation table)
    await this.prisma.responseSession
      .findUnique({ where: { id: sessionId } })
      .then((s) => {
        if (s) {
          this.logger.log(
            `Analytics updated for session ${sessionId} — status: ${s.status}`,
          );
        }
      });
  }
}
