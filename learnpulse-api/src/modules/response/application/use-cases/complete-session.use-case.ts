import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@shared/prisma/prisma.service';
import { RedisService } from '@shared/redis/redis.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { ResponseSession, SessionStatus } from '@prisma/client';

export interface CompleteSessionResult {
  session: ResponseSession;
  score: number | null;
  passed: boolean | null;
  certificateQueued: boolean;
}

@Injectable()
export class CompleteSessionUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    @InjectQueue('certificate-queue')
    private readonly certificateQueue: Queue,
    @InjectQueue('analytics-queue')
    private readonly analyticsQueue: Queue,
  ) {}

  async execute(sessionId: string, userId: string): Promise<CompleteSessionResult> {
    const session = await this.prisma.responseSession.findFirst({
      where: { id: sessionId, userId, status: SessionStatus.IN_PROGRESS },
      include: {
        form: { select: { id: true, config: true, type: true } },
        itemResponses: true,
      },
    });

    if (!session) throw new NotFoundException('Active session not found');

    const config = session.form.config as Record<string, unknown>;
    const passingScore = config['passingScore'] as number | undefined;
    const certificateOnPass = config['certificateOnPass'] as boolean | undefined;

    // Calculate score from scored questions
    const scoredResponses = session.itemResponses.filter(
      (r) => r.isCorrect !== null,
    );

    let score: number | null = null;
    let passed: boolean | null = null;

    if (scoredResponses.length > 0) {
      // Get total possible points from items
      const items = await this.prisma.item.findMany({
        where: {
          id: { in: scoredResponses.map((r) => r.itemId) },
          type: 'QUESTION',
        },
      });

      let totalPoints = 0;
      let earnedPoints = 0;

      for (const item of items) {
        const content = item.content as { points?: number };
        const points = content.points ?? 1;
        totalPoints += points;

        const response = scoredResponses.find((r) => r.itemId === item.id);
        if (response?.isCorrect) {
          earnedPoints += points;
        }
      }

      score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;

      if (passingScore !== undefined) {
        passed = score >= passingScore;
      }
    }

    const completedSession = await this.prisma.responseSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.COMPLETED,
        completedAt: new Date(),
        score: score !== null ? score : null,
        passed,
      },
    });

    // Clean up Redis cache
    await this.redis.deleteSessionProgress(sessionId);
    await this.redis.incrementFormCompletes(session.form.id);

    // Update assignment status
    await this.prisma.assignment.updateMany({
      where: { formId: session.form.id, userId, status: 'IN_PROGRESS' },
      data: { status: 'COMPLETED' },
    });

    // Queue certificate generation if training passed
    let certificateQueued = false;
    if (session.form.type === 'TRAINING' && passed === true && certificateOnPass) {
      await this.certificateQueue.add('generate', {
        sessionId,
        userId,
        formId: session.form.id,
        score,
      });
      certificateQueued = true;
    }

    // Queue analytics update
    await this.analyticsQueue.add('update-metrics', {
      formId: session.form.id,
      sessionId,
      score,
      passed,
    });

    return {
      session: completedSession,
      score,
      passed,
      certificateQueued,
    };
  }
}
