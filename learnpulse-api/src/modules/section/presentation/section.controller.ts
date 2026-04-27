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
import { Roles } from '@shared/decorators/roles.decorator';
import { CurrentTenant } from '@shared/decorators/current-tenant.decorator';
import { SectionService } from '../application/section.service';
import {
  CreateSectionDto,
  ReorderItemsDto,
  UpdateSectionDto,
} from '../application/dtos/section.dto';

@Controller()
export class SectionController {
  constructor(private readonly sectionService: SectionService) {}

  @Post('forms/:formId/sections')
  @Roles('CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  create(
    @Param('formId', ParseUUIDPipe) formId: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateSectionDto,
  ) {
    return this.sectionService.create(formId, tenantId, dto);
  }

  @Get('forms/:formId/sections')
  @Roles('RESPONDENT', 'REVIEWER', 'CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  findByForm(
    @Param('formId', ParseUUIDPipe) formId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.sectionService.findByForm(formId, tenantId);
  }

  @Patch('sections/:id')
  @Roles('CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
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
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.sectionService.delete(id, tenantId);
  }

  @Patch('sections/:id/reorder-items')
  @Roles('CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  reorderItems(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: ReorderItemsDto,
  ) {
    return this.sectionService.reorderItems(id, tenantId, dto.orderedItemIds);
  }
}
