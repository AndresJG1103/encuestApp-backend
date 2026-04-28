import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { Roles } from '@shared/decorators/roles.decorator';
import { CurrentTenant } from '@shared/decorators/current-tenant.decorator';
import { AnalyticsService } from '../application/analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth('JWT')
@ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
@ApiForbiddenResponse({ description: 'Requires REVIEWER role or higher' })
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('forms/:id/summary')
  @Roles('REVIEWER', 'CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Completion/pass-rate summary for a form [REVIEWER]' })
  @ApiOkResponse({ description: 'Summary stats: total, completed, passed, avgScore' })
  @ApiNotFoundResponse({ description: 'Form not found' })
  summary(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.analyticsService.getSummary(id, tenantId);
  }

  @Get('forms/:id/questions')
  @Roles('REVIEWER', 'CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Per-question correct/incorrect counts [REVIEWER]' })
  @ApiOkResponse({ description: 'Array of { itemId, correctCount, incorrectCount, totalAnswers }' })
  @ApiNotFoundResponse({ description: 'Form not found' })
  questions(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.analyticsService.getQuestionAnalytics(id, tenantId);
  }

  @Get('forms/:id/users')
  @Roles('REVIEWER', 'CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Per-user completion and score breakdown [REVIEWER]' })
  @ApiOkResponse({ description: 'Array of { userId, status, score, completedAt }' })
  @ApiNotFoundResponse({ description: 'Form not found' })
  users(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.analyticsService.getUserProgress(id, tenantId);
  }

  @Get('forms/:id/time')
  @Roles('REVIEWER', 'CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Average completion time and abandonment rate [REVIEWER]' })
  @ApiOkResponse({ description: '{ avgTimeMs, abandonedCount, completedCount }' })
  @ApiNotFoundResponse({ description: 'Form not found' })
  time(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.analyticsService.getTimeAnalytics(id, tenantId);
  }
}

