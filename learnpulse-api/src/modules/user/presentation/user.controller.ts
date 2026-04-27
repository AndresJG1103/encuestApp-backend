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
import { UserService } from '../application/user.service';
import { AssignRoleDto, CreateUserDto, UpdateUserDto } from '../application/dtos/user.dto';
import { RoleType } from '@prisma/client';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Roles('TENANT_ADMIN', 'SUPER_ADMIN')
  create(
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateUserDto,
  ) {
    return this.userService.create(tenantId, dto);
  }

  @Get()
  @Roles('TENANT_ADMIN', 'SUPER_ADMIN')
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.userService.findAll(tenantId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @Roles('TENANT_ADMIN', 'SUPER_ADMIN')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.userService.findById(id, tenantId);
  }

  @Patch(':id')
  @Roles('TENANT_ADMIN', 'SUPER_ADMIN')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.update(id, tenantId, dto);
  }

  @Post(':id/roles')
  @Roles('TENANT_ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  assignRole(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: AssignRoleDto,
  ) {
    return this.userService.assignRole(id, tenantId, dto.role as RoleType);
  }

  @Delete(':id/roles/:role')
  @Roles('TENANT_ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeRole(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Param('role') role: string,
  ) {
    return this.userService.removeRole(id, tenantId, role as RoleType);
  }

  @Delete(':id')
  @Roles('TENANT_ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.userService.softDelete(id, tenantId);
  }
}
