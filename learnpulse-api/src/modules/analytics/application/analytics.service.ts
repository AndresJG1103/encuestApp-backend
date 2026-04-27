import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@shared/prisma/prisma.service';
import { RedisService } from '@shared/redis/redis.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private async verifyForm(formId: string, tenantId: string) {
    const form = await this.prisma.form.findFirst({
      where: { id: formId, tenantId, deletedAt: null },
    });
    if (!form) throw new NotFoundException('Form not found');
    return form;
  }

  async getSummary(formId: string, tenantId: string) {
    await this.verifyForm(formId, tenantId);

    const [totalSessions, completedSessions, scores, redisStats] =
      await Promise.all([
        this.prisma.responseSession.count({ where: { formId } }),
        this.prisma.responseSession.count({
          where: { formId, status: 'COMPLETED' },
        }),
        this.prisma.responseSession.aggregate({
          where: { formId, status: 'COMPLETED', score: { not: null } },
          _avg: { score: true },
          _min: { score: true },
          _max: { score: true },
        }),
        this.redis.getFormStats(formId),
      ]);

    const passedCount = await this.prisma.responseSession.count({
      where: { formId, status: 'COMPLETED', passed: true },
    });

    const completionRate =
      totalSessions > 0
        ? Math.round((completedSessions / totalSessions) * 100)
        : 0;

    const passRate =
      completedSessions > 0
        ? Math.round((passedCount / completedSessions) * 100)
        : 0;

    return {
      totalStarts: redisStats.starts || totalSessions,
      totalCompletes: redisStats.completes || completedSessions,
      totalSessions,
      completedSessions,
      completionRate,
      passedCount,
      passRate,
      avgScore: scores._avg.score ? Number(scores._avg.score) : null,
      minScore: scores._min.score ? Number(scores._min.score) : null,
      maxScore: scores._max.score ? Number(scores._max.score) : null,
    };
  }

  async getQuestionAnalytics(formId: string, tenantId: string) {
    await this.verifyForm(formId, tenantId);

    const items = await this.prisma.item.findMany({
      where: {
        type: 'QUESTION',
        section: { formId },
      },
      include: {
        itemResponses: {
          select: { answer: true, isCorrect: true },
        },
      },
      orderBy: { order: 'asc' },
    });

    return items.map((item) => {
      const content = item.content as Record<string, unknown>;
      const totalResponses = item.itemResponses.length;
      const correctCount = item.itemResponses.filter(
        (r) => r.isCorrect === true,
      ).length;

      return {
        itemId: item.id,
        questionType: content['questionType'],
        text: content['text'],
        totalResponses,
        correctCount,
        correctRate:
          totalResponses > 0
            ? Math.round((correctCount / totalResponses) * 100)
            : null,
      };
    });
  }

  async getUserProgress(formId: string, tenantId: string) {
    await this.verifyForm(formId, tenantId);

    const sessions = await this.prisma.responseSession.findMany({
      where: { formId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { startedAt: 'desc' },
    });

    return sessions.map((s) => ({
      sessionId: s.id,
      user: s.user,
      attempt: s.attempt,
      status: s.status,
      score: s.score ? Number(s.score) : null,
      passed: s.passed,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
    }));
  }

  async getTimeAnalytics(formId: string, tenantId: string) {
    await this.verifyForm(formId, tenantId);

    const completedSessions = await this.prisma.responseSession.findMany({
      where: { formId, status: 'COMPLETED', completedAt: { not: null } },
      select: { startedAt: true, completedAt: true },
    });

    const durations = completedSessions
      .filter((s) => s.completedAt !== null)
      .map((s) => s.completedAt!.getTime() - s.startedAt.getTime());

    const avgDurationMs =
      durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : null;

    const abandonedCount = await this.prisma.responseSession.count({
      where: { formId, status: 'ABANDONED' },
    });

    const totalCount = await this.prisma.responseSession.count({
      where: { formId },
    });

    const timeBySection = await this.prisma.itemResponse.groupBy({
      by: ['itemId'],
      where: {
        session: { formId },
      },
      _avg: { timeSpentMs: true },
      _sum: { timeSpentMs: true },
    });

    return {
      avgDurationMs,
      avgDurationMinutes: avgDurationMs ? Math.round(avgDurationMs / 60000) : null,
      abandonedCount,
      abandonRate:
        totalCount > 0 ? Math.round((abandonedCount / totalCount) * 100) : 0,
      timeBySection,
    };
  }
}
