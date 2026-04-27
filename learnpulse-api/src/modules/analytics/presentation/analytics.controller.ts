import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { Roles } from '@shared/decorators/roles.decorator';
import { CurrentTenant } from '@shared/decorators/current-tenant.decorator';
import { AnalyticsService } from '../application/analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('forms/:id/summary')
  @Roles('REVIEWER', 'CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  summary(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.analyticsService.getSummary(id, tenantId);
  }

  @Get('forms/:id/questions')
  @Roles('REVIEWER', 'CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  questions(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.analyticsService.getQuestionAnalytics(id, tenantId);
  }

  @Get('forms/:id/users')
  @Roles('REVIEWER', 'CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  users(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.analyticsService.getUserProgress(id, tenantId);
  }

  @Get('forms/:id/time')
  @Roles('REVIEWER', 'CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  time(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.analyticsService.getTimeAnalytics(id, tenantId);
  }
}
