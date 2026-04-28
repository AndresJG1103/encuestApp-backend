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
import { TenantService } from '../application/tenant.service';
import { CreateTenantDto } from '../application/dtos/create-tenant.dto';
import { UpdateTenantDto } from '../application/dtos/update-tenant.dto';

@ApiTags('Tenants')
@ApiBearerAuth('JWT')
@ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
@ApiForbiddenResponse({ description: 'Insufficient role' })
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Create a new tenant [SUPER_ADMIN]' })
  @ApiCreatedResponse({ description: 'Tenant created' })
  create(@Body() dto: CreateTenantDto) {
    return this.tenantService.create(dto);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'TENANT_ADMIN')
  @ApiOperation({ summary: 'Get tenant by ID [SUPER_ADMIN, TENANT_ADMIN]' })
  @ApiOkResponse({ description: 'Tenant object' })
  @ApiNotFoundResponse({ description: 'Tenant not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantService.findById(id);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN', 'TENANT_ADMIN')
  @ApiOperation({ summary: 'Update tenant [SUPER_ADMIN, TENANT_ADMIN]' })
  @ApiOkResponse({ description: 'Updated tenant' })
  @ApiNotFoundResponse({ description: 'Tenant not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenantDto,
  ) {
    return this.tenantService.update(id, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete tenant [SUPER_ADMIN]' })
  @ApiNoContentResponse({ description: 'Tenant deleted' })
  @ApiNotFoundResponse({ description: 'Tenant not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.tenantService.softDelete(id);
  }
}

