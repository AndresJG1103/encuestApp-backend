import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@shared/prisma/prisma.service';
import { Item, RoleType } from '@prisma/client';
import { CreateItemDto, UpdateItemDto } from './dtos/item.dto';
import { serializeItem, serializeItems } from './serializers/item.serializer';

@Injectable()
export class ItemService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifySection(sectionId: string, tenantId: string) {
    const section = await this.prisma.section.findFirst({
      where: { id: sectionId, form: { tenantId, deletedAt: null } },
    });
    if (!section) throw new NotFoundException('Section not found');
    return section;
  }

  private async findItemById(id: string, tenantId: string): Promise<Item> {
    const item = await this.prisma.item.findFirst({
      where: { id, section: { form: { tenantId, deletedAt: null } } },
    });
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }

  async create(
    sectionId: string,
    tenantId: string,
    dto: CreateItemDto,
  ): Promise<Item> {
    await this.verifySection(sectionId, tenantId);

    return this.prisma.item.create({
      data: {
        sectionId,
        type: dto.type,
        order: dto.order,
        content: dto.content as unknown as import('@prisma/client').Prisma.InputJsonValue,
      },
    });
  }

  async findBySection(
    sectionId: string,
    tenantId: string,
    userRoles: RoleType[],
  ): Promise<Item[]> {
    await this.verifySection(sectionId, tenantId);

    const items = await this.prisma.item.findMany({
      where: { sectionId },
      orderBy: { order: 'asc' },
    });

    return serializeItems(items, userRoles);
  }

  async findById(
    id: string,
    tenantId: string,
    userRoles: RoleType[],
  ): Promise<Item> {
    const item = await this.findItemById(id, tenantId);
    return serializeItem(item, userRoles);
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateItemDto,
  ): Promise<Item> {
    await this.findItemById(id, tenantId);

    return this.prisma.item.update({
      where: { id },
      data: {
        ...(dto.order !== undefined && { order: dto.order }),
        ...(dto.content && { content: dto.content as unknown as import('@prisma/client').Prisma.InputJsonValue }),
      },
    });
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.findItemById(id, tenantId);
    await this.prisma.item.delete({ where: { id } });
  }
}
