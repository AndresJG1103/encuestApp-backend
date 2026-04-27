import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@shared/prisma/prisma.service';
import { RedisService } from '@shared/redis/redis.service';
import {
  ItemResponse,
  ItemType,
  SessionStatus,
} from '@prisma/client';

export interface SubmitAnswerInput {
  sessionId: string;
  itemId: string;
  answer: Record<string, unknown>;
  timeSpentMs?: number;
  userId: string;
}

interface QuestionContent {
  questionType: string;
  correctAnswers?: string[];
  points?: number;
}

@Injectable()
export class SubmitAnswerUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async execute(input: SubmitAnswerInput): Promise<ItemResponse> {
    const { sessionId, itemId, answer, timeSpentMs = 0, userId } = input;

    // Verify session belongs to the user and is IN_PROGRESS
    const session = await this.prisma.responseSession.findFirst({
      where: { id: sessionId, userId, status: SessionStatus.IN_PROGRESS },
      include: {
        form: {
          select: { id: true, config: true },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Active session not found');
    }

    // Verify item exists and belongs to the form's sections
    const item = await this.prisma.item.findFirst({
      where: {
        id: itemId,
        section: {
          formId: session.formId,
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Item not found in this form');
    }

    // Validate the answer structure
    this.validateAnswer(item.type as ItemType, answer);

    // Determine correctness for QUESTION items
    let isCorrect: boolean | null = null;
    if (item.type === ItemType.QUESTION) {
      isCorrect = this.evaluateAnswer(
        item.content as unknown as QuestionContent,
        answer,
      );
    }

    // Upsert item response (allow re-answering)
    const itemResponse = await this.prisma.itemResponse.upsert({
      where: {
        sessionId_itemId: { sessionId, itemId },
      },
      create: {
        sessionId,
        itemId,
        answer: answer as unknown as import('@prisma/client').Prisma.InputJsonValue,
        isCorrect,
        timeSpentMs,
      },
      update: {
        answer: answer as unknown as import('@prisma/client').Prisma.InputJsonValue,
        isCorrect,
        timeSpentMs,
        answeredAt: new Date(),
      },
    });

    // Update session progress snapshot in Redis and DB
    const currentSnapshot =
      (await this.redis.getSessionProgress(sessionId)) ?? {};
    const answeredItemIds = (
      (currentSnapshot['answeredItemIds'] as string[]) ?? []
    ).filter((id) => id !== itemId);
    answeredItemIds.push(itemId);

    const updatedSnapshot = {
      ...currentSnapshot,
      answeredItemIds,
      lastSavedAt: new Date().toISOString(),
    };

    await Promise.all([
      this.redis.setSessionProgress(sessionId, updatedSnapshot),
      this.prisma.responseSession.update({
        where: { id: sessionId },
        data: { progressSnapshot: updatedSnapshot },
      }),
    ]);

    return itemResponse;
  }

  private validateAnswer(itemType: ItemType, answer: Record<string, unknown>): void {
    if (itemType !== ItemType.QUESTION) return;

    const hasSelectedArray =
      Array.isArray(answer['selected']) || answer['selected'] === undefined;
    const hasText = typeof answer['text'] === 'string' || answer['text'] === undefined;
    const hasValue =
      typeof answer['value'] === 'number' ||
      typeof answer['value'] === 'boolean' ||
      answer['value'] === undefined;

    if (!hasSelectedArray && !hasText && !hasValue) {
      throw new BadRequestException('Invalid answer format');
    }
  }

  private evaluateAnswer(
    content: QuestionContent,
    answer: Record<string, unknown>,
  ): boolean | null {
    if (!content.correctAnswers || content.correctAnswers.length === 0) {
      return null; // opinion-only question
    }

    const questionType = content.questionType;

    switch (questionType) {
      case 'SINGLE_CHOICE': {
        const selected = (answer['selected'] as string[]) ?? [];
        if (selected.length !== 1) return false;
        return content.correctAnswers.includes(selected[0]);
      }

      case 'MULTIPLE_CHOICE': {
        const selected = new Set((answer['selected'] as string[]) ?? []);
        const correct = new Set(content.correctAnswers);
        if (selected.size !== correct.size) return false;
        for (const id of selected) {
          if (!correct.has(id)) return false;
        }
        return true;
      }

      case 'BOOLEAN': {
        const value = String(answer['value']);
        return content.correctAnswers.includes(value);
      }

      case 'SCALE':
      case 'RATING': {
        const value = String(answer['value']);
        return content.correctAnswers.includes(value);
      }

      case 'OPEN_TEXT': {
        // Open text never auto-graded unless exact match specified
        const text = String(answer['text'] ?? '').trim().toLowerCase();
        return content.correctAnswers
          .map((a) => a.toLowerCase().trim())
          .includes(text);
      }

      default:
        return null;
    }
  }
}
