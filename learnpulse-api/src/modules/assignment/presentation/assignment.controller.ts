import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Roles } from '@shared/decorators/roles.decorator';
import { CurrentTenant } from '@shared/decorators/current-tenant.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { JwtPayload } from '@shared/types/jwt-payload.type';
import { AssignmentService } from '../application/assignment.service';
import {
  CreateAssignmentDto,
  UpdateAssignmentDto,
} from '../application/dtos/assignment.dto';

@Controller('assignments')
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Post()
  @Roles('CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAssignmentDto,
  ) {
    return this.assignmentService.create(tenantId, user.sub, dto);
  }

  @Get('my')
  @Roles('RESPONDENT', 'REVIEWER', 'CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  findMine(
    @CurrentUser() user: JwtPayload,
    @CurrentTenant() tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.assignmentService.findMine(user.sub, tenantId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Patch(':id')
  @Roles('CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateAssignmentDto,
  ) {
    return this.assignmentService.update(id, tenantId, dto);
  }
}
