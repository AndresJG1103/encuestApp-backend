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
import { CurrentUser } from '@shared/decorators/current-user.decorator';
import { JwtPayload } from '@shared/types/jwt-payload.type';
import { ItemService } from '../application/item.service';
import { CreateItemDto, UpdateItemDto } from '../application/dtos/item.dto';
import { RoleType } from '@prisma/client';

@ApiTags('Items')
@ApiBearerAuth('JWT')
@ApiUnauthorizedResponse({ description: 'Missing or invalid access token' })
@ApiForbiddenResponse({ description: 'Insufficient role' })
@Controller()
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  @Post('sections/:sectionId/items')
  @Roles('CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Add an item to a section [CREATOR]' })
  @ApiCreatedResponse({ description: 'Item created' })
  @ApiNotFoundResponse({ description: 'Section not found' })
  create(
    @Param('sectionId', ParseUUIDPipe) sectionId: string,
    @CurrentTenant() tenantId: string,
    @Body() dto: CreateItemDto,
  ) {
    return this.itemService.create(sectionId, tenantId, dto);
  }

  @Get('sections/:sectionId/items')
  @Roles('RESPONDENT', 'REVIEWER', 'CREATOR', 'TENANT_ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'List items in a section â€” correctAnswers stripped for RESPONDENT role' })
  @ApiOkResponse({ description: 'Array of items (correctAnswers hidden for respondents)' })
  @ApiNotFoundResponse({ description: 'Section not found' })
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
  @ApiOperation({ summary: 'Update an item [CREATOR]' })
  @ApiOkResponse({ description: 'Updated item' })
  @ApiNotFoundResponse({ description: 'Item not found' })
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
  @ApiOperation({ summary: 'Delete an item [CREATOR]' })
  @ApiNoContentResponse({ description: 'Item deleted' })
  @ApiNotFoundResponse({ description: 'Item not found' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.itemService.delete(id, tenantId);
  }
}

