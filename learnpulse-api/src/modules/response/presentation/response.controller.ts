import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiQuery,
} from '@nestjs/swagger';
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

@ApiTags('Responses')
@ApiBearerAuth('JWT')
@ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
@ApiForbiddenResponse({ description: 'Insufficient role' })
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
  @ApiOperation({ summary: 'Start a new response session for a published form' })
  @ApiCreatedResponse({ description: 'Session created and cached in Redis' })
  @ApiNotFoundResponse({ description: 'Form not found or not published' })
  @ApiConflictResponse({ description: 'Session already in progress or maxAttempts reached' })
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
  @ApiOperation({ summary: 'Submit (or update) an answer for one item' })
  @ApiOkResponse({ description: 'ItemResponse upserted with isCorrect flag' })
  @ApiNotFoundResponse({ description: 'Session or item not found' })
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
  @ApiOperation({ summary: 'Complete session â€” calculates score, queues certificate if training' })
  @ApiOkResponse({ description: '{ session, score, passed, certificateQueued }' })
  @ApiNotFoundResponse({ description: 'Session not found' })
  complete(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.completeSession.execute(sessionId, user.sub);
  }

  @Get()
  @Roles('REVIEWER', 'CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({
    summary:
      'List response sessions filtered by form/user/status. Scope: SUPER_ADMIN=any, TENANT_ADMIN/REVIEWER=tenant, CREATOR=own forms',
  })
  @ApiOkResponse({ description: 'Paginated list of sessions' })
  @ApiQuery({ name: 'formId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['IN_PROGRESS', 'SUBMITTED', 'COMPLETED', 'ABANDONED'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @CurrentTenant() tenantId: string,
    @Query('formId') formId?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = Math.min(limit ? parseInt(limit, 10) : 20, 100);
    const skip = (pageNum - 1) * limitNum;

    const isSuperAdmin = user.roles.includes('SUPER_ADMIN');
    const isTenantStaff =
      user.roles.includes('TENANT_ADMIN') || user.roles.includes('REVIEWER');
    const isCreatorOnly =
      !isSuperAdmin && !isTenantStaff && user.roles.includes('CREATOR');

    const where: any = {};
    if (formId) where.formId = formId;
    if (userId) where.userId = userId;
    if (status) where.status = status;

    if (!isSuperAdmin) {
      where.form = where.form ?? {};
      if (isCreatorOnly) {
        where.form.createdById = user.sub;
      } else {
        where.form.tenantId = tenantId;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.responseSession.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { startedAt: 'desc' },
        include: {
          form: { select: { id: true, title: true, type: true } },
          user: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      }),
      this.prisma.responseSession.count({ where }),
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

  @Get('my')
  @Roles('RESPONDENT', 'CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List my response sessions (paginated)' })
  @ApiOkResponse({ description: 'Paginated list of sessions with form info' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
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

  @Get(':sessionId')
  @Roles('RESPONDENT', 'REVIEWER', 'CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({
    summary:
      'Get a single response session. SUPER_ADMIN: any. TENANT_ADMIN/REVIEWER: same tenant. CREATOR: own or sessions of forms they created. RESPONDENT: own only.',
  })
  @ApiOkResponse({ description: 'Session with form summary' })
  @ApiForbiddenResponse({ description: 'No access to this session' })
  @ApiNotFoundResponse({ description: 'Session not found' })
  async findOne(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @CurrentUser() user: JwtPayload,
    @CurrentTenant() tenantId: string,
  ) {
    const session = await this.prisma.responseSession.findUnique({
      where: { id: sessionId },
      include: {
        form: {
          select: {
            id: true,
            title: true,
            type: true,
            config: true,
            tenantId: true,
            createdById: true,
          },
        },
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const isOwner = session.userId === user.sub;
    const isSuperAdmin = user.roles.includes('SUPER_ADMIN');
    const isTenantStaff =
      session.form.tenantId === tenantId &&
      (user.roles.includes('TENANT_ADMIN') || user.roles.includes('REVIEWER'));
    const isFormCreator =
      user.roles.includes('CREATOR') &&
      session.form.createdById === user.sub;

    if (!isOwner && !isSuperAdmin && !isTenantStaff && !isFormCreator) {
      throw new ForbiddenException('No access to this session');
    }

    return session;
  }

  @Get(':sessionId/progress')
  @Roles('RESPONDENT', 'CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get current session progress snapshot (Redis first, then DB)' })
  @ApiOkResponse({ description: 'Progress snapshot object' })
  async progress(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    const cached = await this.redis.getSessionProgress(sessionId);
    if (cached) return cached;

    const session = await this.prisma.responseSession.findFirst({
      where: { id: sessionId, userId: user.sub },
      select: { progressSnapshot: true },
    });

    return session?.progressSnapshot ?? {};
  }
}

