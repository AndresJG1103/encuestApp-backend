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
} from '@nestjs/swagger';
import { Roles } from '@shared/decorators/roles.decorator';
import { CurrentTenant } from '@shared/decorators/current-tenant.decorator';
import { SectionService } from '../application/section.service';
import {
  CreateSectionDto,
  ReorderItemsDto,
  UpdateSectionDto,
} from '../application/dtos/section.dto';

@ApiTags('Sections')
@ApiBearerAuth('JWT')
@ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
@ApiForbiddenResponse({ description: 'Insufficient role' })
@Controller()
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  @Post('forms/:formId/sections')
  @Roles('CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Add a section to a form [CREATOR]' })
  @ApiCreatedResponse({ description: 'Section created' })
  @ApiNotFoundResponse({ description: 'Form not found' })
  create(
    @Param('formId', ParseUUIDPipe) formId: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateSectionDto,
  ) {
    return this.sectionService.create(formId, tenantId, dto);
  }

  @Get('forms/:formId/sections')
  @Roles('RESPONDENT', 'REVIEWER', 'CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List all sections of a form' })
  @ApiOkResponse({ description: 'Array of sections ordered by order field' })
  @ApiNotFoundResponse({ description: 'Form not found' })
  findByForm(
    @Param('formId', ParseUUIDPipe) formId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.sectionService.findByForm(formId, tenantId);
  }

  @Patch('sections/:id')
  @Roles('CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update a section [CREATOR]' })
  @ApiOkResponse({ description: 'Updated section' })
  @ApiNotFoundResponse({ description: 'Section not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateSectionDto,
  ) {
    return this.sectionService.update(id, tenantId, dto);
  }

  @Delete('sections/:id')
  @Roles('CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a section and all its items [CREATOR]' })
  @ApiNoContentResponse({ description: 'Section deleted' })
  @ApiNotFoundResponse({ description: 'Section not found' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.sectionService.delete(id, tenantId);
  }

  @Patch('sections/:id/reorder-items')
  @Roles('CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Reorder items within a section [CREATOR]' })
  @ApiOkResponse({ description: 'Items reordered' })
  @ApiNotFoundResponse({ description: 'Section not found' })
  reorderItems(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: ReorderItemsDto,
  ) {
    return this.sectionService.reorderItems(id, tenantId, dto.orderedItemIds);
  }
}

