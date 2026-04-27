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
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { JwtPayload } from '@shared/types/jwt-payload.type';
import { ItemService } from '../application/item.service';
import { CreateItemDto, UpdateItemDto } from '../application/dtos/item.dto';
import { RoleType } from '@prisma/client';

@Controller()
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Post('sections/:sectionId/items')
  @Roles('CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  create(
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateItemDto,
  ) {
    return this.itemService.create(sectionId, tenantId, dto);
  }

  @Get('sections/:sectionId/items')
  @Roles('RESPONDENT', 'REVIEWER', 'CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  findBySection(
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.itemService.findBySection(
      sectionId,
      tenantId,
      user.roles as RoleType[],
    );
  }

  @Patch('items/:id')
  @Roles('CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: UpdateItemDto,
  ) {
    return this.itemService.update(id, tenantId, dto);
  }

  @Delete('items/:id')
  @Roles('CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.itemService.delete(id, tenantId);
  }
}
