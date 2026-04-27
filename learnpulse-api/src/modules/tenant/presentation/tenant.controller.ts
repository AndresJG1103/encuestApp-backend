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
import { TenantService } from '../application/tenant.service';
import { CreateTenantDto } from '../application/dtos/create-tenant.dto';
import { UpdateTenantDto } from '../application/dtos/update-tenant.dto';

@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @Roles('SUPER_ADMIN')
  create(@Body() dto: CreateTenantDto) {
    return this.tenantService.create(dto);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'TENANT_ADMIN')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantService.findById(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'TENANT_ADMIN')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.tenantService.update(id, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantService.softDelete(id);
  }
}
