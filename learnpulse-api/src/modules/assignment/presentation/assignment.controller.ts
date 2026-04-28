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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '@shared/decorators/roles.decorator';
import { CurrentTenant } from '@shared/decorators/current-tenant.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { JwtPayload } from '@shared/types/jwt-payload.type';
import { AssignmentService } from '../application/assignment.service';
import {
  CreateAssignmentDto,
  UpdateAssignmentDto,
} from '../application/dtos/assignment.dto';

@ApiTags('Assignments')
@ApiBearerAuth('JWT')
@ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
@ApiForbiddenResponse({ description: 'Insufficient role' })
@Controller('assignments')
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Post()
  @Roles('CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Assign a form to a user [CREATOR]' })
  @ApiCreatedResponse({ description: 'Assignment created' })
  create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAssignmentDto,
  ) {
    return this.assignmentService.create(tenantId, user.sub, dto);
  }

  @Get('my')
  @Roles('RESPONDENT', 'REVIEWER', 'CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get my assigned forms (paginated)' })
  @ApiOkResponse({ description: 'Paginated list of assignments' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
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
  @ApiOperation({ summary: 'Update assignment status or due date [CREATOR]' })
  @ApiOkResponse({ description: 'Updated assignment' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateAssignmentDto,
  ) {
    return this.assignmentService.update(id, tenantId, dto);
  }
}

