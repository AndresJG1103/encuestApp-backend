import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@shared/prisma/prisma.service';
import { RedisService } from '@shared/redis/redis.service';
import { FormStatus, ResponseSession, SessionStatus } from '@prisma/client';

export interface StartSessionInput {
  formId: string;
  userId: string;
  tenantId: string;
}

@Injectable()
export class StartSessionUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async execute(input: StartSessionInput): Promise<ResponseSession> {
    const { formId, userId, tenantId } = input;

    // Verify form exists and is published within tenant
    const form = await this.prisma.form.findFirst({
      where: { id: formId, tenantId, status: FormStatus.PUBLISHED, deletedAt: null },
      include: {},
    });

    if (!form) throw new NotFoundException('Form not found or not published');

    // Parse config for maxAttempts constraint
    const config = form.config as Record<string, unknown>;
    const maxAttempts = config['maxAttempts'] as number | undefined;

    // Count existing attempts
    const attemptCount = await this.prisma.responseSession.count({
      where: { formId, userId, status: { in: [SessionStatus.COMPLETED] } },
    });

    if (maxAttempts && attemptCount >= maxAttempts) {
      throw new BadRequestException('Maximum attempts reached for this form');
    }

    // Check for existing IN_PROGRESS session
    const inProgress = await this.prisma.responseSession.findFirst({
      where: { formId, userId, status: SessionStatus.IN_PROGRESS },
    });

    if (inProgress) {
      throw new ConflictException('A session is already in progress for this form');
    }

    const session = await this.prisma.responseSession.create({
      data: {
        formId,
        userId,
        attempt: attemptCount + 1,
        status: SessionStatus.IN_PROGRESS,
        progressSnapshot: {
          currentSectionIndex: 0,
          visitedSectionIds: [],
          answeredItemIds: [],
          lastSavedAt: new Date().toISOString(),
        },
      },
    });

    // Cache session progress in Redis
    await this.redis.setSessionProgress(session.id, {
      currentSectionIndex: 0,
      visitedSectionIds: [],
      answeredItemIds: [],
      lastSavedAt: new Date().toISOString(),
    });

    // Increment analytics counter
    await this.redis.incrementFormStarts(formId);

    // Update assignment status if exists
    await this.prisma.assignment.updateMany({
      where: {
        formId,
        userId,
        status: { in: ['PENDING'] },
      },
      data: { status: 'IN_PROGRESS' },
    });

    return session;
  }
}
