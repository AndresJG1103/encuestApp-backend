import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '@shared/decorators/roles.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { CurrentTenant } from '@shared/decorators/current-tenant.decorator';
import { JwtPayload } from '@shared/types/jwt-payload.type';
import { StartSessionUseCase } from '../application/use-cases/start-session.use-case';
import { SubmitAnswerUseCase } from '../application/use-cases/submit-answer.use-case';
import { CompleteSessionUseCase } from '../application/use-cases/complete-session.use-case';
import { StartSessionDto } from '../application/dtos/response.dto';
import { SubmitAnswerDto } from '../application/dtos/submit-answer.dto';
import { PrismaService } from '@shared/prisma/prisma.service';
import { RedisService } from '@shared/redis/redis.service';

@Controller('responses')
export class ResponseController {
  constructor(
    private readonly startSession: StartSessionUseCase,
    private readonly submitAnswer: SubmitAnswerUseCase,
    private readonly completeSession: CompleteSessionUseCase,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Post('start')
  @Roles('RESPONDENT', 'CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  start(
    @CurrentUser() user: JwtPayload,
    @CurrentTenant() tenantId: string,
    @Body() dto: StartSessionDto,
  ) {
    return this.startSession.execute({
      formId: dto.formId,
      userId: user.sub,
      tenantId,
    });
  }

  @Post(':sessionId/answer')
  @Roles('RESPONDENT', 'CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  answer(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: SubmitAnswerDto,
  ) {
    return this.submitAnswer.execute({
      sessionId,
      itemId: dto.itemId,
      answer: dto.answer,
      timeSpentMs: dto.timeSpentMs,
      userId: user.sub,
    });
  }

  @Post(':sessionId/complete')
  @Roles('RESPONDENT', 'CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  complete(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.completeSession.execute(sessionId, user.sub);
  }

  @Get(':sessionId/progress')
  @Roles('RESPONDENT', 'CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  async progress(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    // Try Redis cache first
    const cached = await this.redis.getSessionProgress(sessionId);
    if (cached) return cached;

    // Fall back to DB
    const session = await this.prisma.responseSession.findFirst({
      where: { id: sessionId, userId: user.sub },
      select: { progressSnapshot: true },
    });

    return session?.progressSnapshot ?? {};
  }

  @Get('my')
  @Roles('RESPONDENT', 'CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  async findMine(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = Math.min(limit ? parseInt(limit, 10) : 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await Promise.all([
      this.prisma.responseSession.findMany({
        where: { userId: user.sub },
        skip,
        take: limitNum,
        orderBy: { startedAt: 'desc' },
        include: {
          form: { select: { id: true, title: true, type: true } },
        },
      }),
      this.prisma.responseSession.count({ where: { userId: user.sub } }),
    ]);

    return {
      data,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }
}
