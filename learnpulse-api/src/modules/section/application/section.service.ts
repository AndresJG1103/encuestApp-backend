import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@shared/prisma/prisma.service';
import { Section } from '@prisma/client';
import { CreateSectionDto, UpdateSectionDto } from './dtos/section.dto';

@Injectable()
export class SectionService {
  constructor(private readonly prisma: PrismaService) {}

  private async verifyFormOwnership(
    formId: string,
    tenantId: string,
  ): Promise<void> {
    const form = await this.prisma.form.findFirst({
      where: { id: formId, tenantId, deletedAt: null },
    });
    if (!form) throw new NotFoundException('Form not found');
  }

  async create(
    formId: string,
    tenantId: string,
    dto: CreateSectionDto,
  ): Promise<Section> {
    await this.verifyFormOwnership(formId, tenantId);

    return this.prisma.section.create({
      data: {
        formId,
        title: dto.title,
        order: dto.order,
        branchingRules: (dto.branchingRules ?? []) as object[],
      },
    });
  }

  async findByForm(formId: string, tenantId: string): Promise<Section[]> {
    await this.verifyFormOwnership(formId, tenantId);

    return this.prisma.section.findMany({
      where: { formId },
      orderBy: { order: 'asc' },
      include: { items: { orderBy: { order: 'asc' } } },
    });
  }

  async findById(id: string, tenantId: string): Promise<Section> {
    const section = await this.prisma.section.findFirst({
      where: {
        id,
        form: { tenantId, deletedAt: null },
      },
      include: { items: { orderBy: { order: 'asc' } } },
    });

    if (!section) throw new NotFoundException('Section not found');
    return section;
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateSectionDto,
  ): Promise<Section> {
    await this.findById(id, tenantId);

    return this.prisma.section.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.order !== undefined && { order: dto.order }),
        ...(dto.branchingRules && {
          branchingRules: dto.branchingRules as object[],
        }),
      },
    });
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.findById(id, tenantId);
    await this.prisma.section.delete({ where: { id } });
  }

  async reorderItems(
    sectionId: string,
    tenantId: string,
    orderedItemIds: string[],
  ): Promise<void> {
    await this.findById(sectionId, tenantId);

    // Verify all items belong to this section
    const items = await this.prisma.item.findMany({
      where: { sectionId, id: { in: orderedItemIds } },
    });

    if (items.length !== orderedItemIds.length) {
      throw new ForbiddenException('One or more items do not belong to this section');
    }

    // Update orders in a transaction
    await this.prisma.$transaction(
      orderedItemIds.map((itemId, index) =>
        this.prisma.item.update({
          where: { id: itemId },
          data: { order: index },
        }),
      ),
    );
  }
}
