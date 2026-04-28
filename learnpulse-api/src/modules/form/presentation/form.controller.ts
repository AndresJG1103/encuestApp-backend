import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
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
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { Roles } from '@shared/decorators/roles.decorator';
import { CurrentTenant } from '@shared/decorators/current-tenant.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { JwtPayload } from '@shared/types/jwt-payload.type';
import { FormService } from '../application/form.service';
import { CreateFormDto, UpdateFormDto } from '../application/dtos/form.dto';

@ApiTags('Forms')
@ApiBearerAuth('JWT')
@ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
@ApiForbiddenResponse({ description: 'Insufficient role' })
@Controller('forms')
export class FormController {
  constructor(private readonly formService: FormService) {}

  @Post()
  @Roles('CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Create a new form [CREATOR]' })
  @ApiCreatedResponse({ description: 'Form created as DRAFT' })
  create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateFormDto,
  ) {
    return this.formService.create(tenantId, user.sub, dto);
  }

  @Get()
  @Roles('RESPONDENT', 'REVIEWER', 'CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List forms in tenant (paginated)' })
  @ApiOkResponse({ description: 'Paginated list of forms' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'type', required: false, enum: ['SURVEY', 'QUIZ', 'TRAINING', 'POLL'] })
  @ApiQuery({ name: 'status', required: false, enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] })
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.formService.findAll(tenantId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      type,
      status,
    });
  }

  @Get(':id')
  @Roles('RESPONDENT', 'REVIEWER', 'CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get form by ID' })
  @ApiOkResponse({ description: 'Form object' })
  @ApiNotFoundResponse({ description: 'Form not found' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.formService.findById(id, tenantId);
  }

  @Patch(':id')
  @Roles('CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update form [CREATOR] â€” if PUBLISHED, creates a new DRAFT copy' })
  @ApiOkResponse({ description: 'Updated (or newly created draft) form' })
  @ApiNotFoundResponse({ description: 'Form not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateFormDto,
  ) {
    return this.formService.update(id, tenantId, dto, user.sub);
  }

  @Delete(':id')
  @Roles('CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete form [CREATOR]' })
  @ApiNoContentResponse({ description: 'Form deleted' })
  @ApiNotFoundResponse({ description: 'Form not found' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.formService.softDelete(id, tenantId, user.sub);
  }

  @Post(':id/publish')
  @Roles('CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Publish a DRAFT form [CREATOR]' })
  @ApiOkResponse({ description: 'Form is now PUBLISHED' })
  @ApiNotFoundResponse({ description: 'Form not found' })
  publish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.formService.publish(id, tenantId, user.sub);
  }

  @Post(':id/duplicate')
  @Roles('CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Deep-copy form with all sections and items [CREATOR]' })
  @ApiCreatedResponse({ description: 'New DRAFT form (copy)' })
  @ApiNotFoundResponse({ description: 'Form not found' })
  duplicate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.formService.duplicate(id, tenantId, user.sub);
  }

  @Delete(':id/archive')
  @Roles('CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Archive a PUBLISHED form [CREATOR]' })
  @ApiNoContentResponse({ description: 'Form archived' })
  @ApiNotFoundResponse({ description: 'Form not found' })
  archive(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.formService.archive(id, tenantId, user.sub);
  }
}

