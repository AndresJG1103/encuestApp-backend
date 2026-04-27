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
import { Roles } from '@shared/decorators/roles.decorator';
import { CurrentTenant } from '@shared/decorators/current-tenant.decorator';
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { JwtPayload } from '@shared/types/jwt-payload.type';
import { FormService } from '../application/form.service';
import { CreateFormDto, UpdateFormDto } from '../application/dtos/form.dto';

@Controller('forms')
export class FormController {
  constructor(private readonly formService: FormService) {}

  @Post()
  @Roles('CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  create(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateFormDto,
  ) {
    return this.formService.create(tenantId, user.sub, dto);
  }

  @Get()
  @Roles('RESPONDENT', 'REVIEWER', 'CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
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
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.formService.findById(id, tenantId);
  }

  @Patch(':id')
  @Roles('CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
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
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.formService.softDelete(id, tenantId, user.sub);
  }

  @Post(':id/publish')
  @Roles('CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  publish(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.formService.publish(id, tenantId, user.sub);
  }

  @Post(':id/duplicate')
  @Roles('CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
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
  archive(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.formService.archive(id, tenantId, user.sub);
  }
}
