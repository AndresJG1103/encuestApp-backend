import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  FORM_REPOSITORY,
  IFormRepository,
} from '../domain/repositories/form.repository.interface';
import { CreateFormDto, UpdateFormDto } from './dtos/form.dto';
import { Form, FormStatus } from '@prisma/client';
import { PaginatedResult, PaginationParams } from '@shared/types/paginated.type';
import { RedisService } from '@shared/redis/redis.service';
import { PrismaService } from '@shared/prisma/prisma.service';

@Injectable()
export class FormService {
  constructor(
    @Inject(FORM_REPOSITORY)
    private readonly formRepo: IFormRepository,
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  async create(tenantId: string, userId: string, dto: CreateFormDto): Promise<Form> {
    return this.formRepo.create({
      tenantId,
      createdById: userId,
      title: dto.title,
      description: dto.description,
      type: dto.type,
      status: FormStatus.DRAFT,
      config: (dto.config ?? {}) as object,
    });
  }

  async findAll(
    tenantId: string,
    params: PaginationParams & { type?: string; status?: string },
  ): Promise<PaginatedResult<Form>> {
    return this.formRepo.findAll(
      { tenantId, type: params.type, status: params.status },
      { page: params.page, limit: params.limit },
    );
  }

  async findById(id: string, tenantId: string): Promise<Form> {
    // Try cache first
    const cached = await this.redis.getFormCache(id, 0);
    if (cached) return cached as Form;

    const form = await this.formRepo.findById(id, tenantId);
    if (!form) throw new NotFoundException('Form not found');

    await this.redis.setFormCache(id, form.version, form);
    return form;
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateFormDto,
    userId: string,
  ): Promise<Form> {
    const form = await this.formRepo.findById(id, tenantId);
    if (!form) throw new NotFoundException('Form not found');

    if (form.createdById !== userId) {
      throw new ForbiddenException('Only the creator can update this form');
    }

    // If form is PUBLISHED, we cannot mutate it directly — increment version and create draft copy
    if (form.status === FormStatus.PUBLISHED) {
      return this.createDraftVersion(form, tenantId, userId, dto);
    }

    const updated = await this.formRepo.update(id, tenantId, {
      title: dto.title,
      description: dto.description,
      config: (dto.config ?? form.config) as object,
    });

    // Invalidate cache
    await this.redis.deleteFormCache(id, form.version);
    return updated;
  }

  private async createDraftVersion(
    original: Form,
    tenantId: string,
    userId: string,
    dto: UpdateFormDto,
  ): Promise<Form> {
    return this.formRepo.create({
      tenantId,
      createdById: userId,
      title: dto.title ?? original.title,
      description: dto.description ?? original.description ?? undefined,
      type: original.type,
      status: FormStatus.DRAFT,
      config: (dto.config ?? original.config) as object,
      version: original.version + 1,
      parentFormId: original.id,
    });
  }

  async publish(id: string, tenantId: string, userId: string): Promise<Form> {
    const form = await this.formRepo.findById(id, tenantId);
    if (!form) throw new NotFoundException('Form not found');

    if (form.createdById !== userId) {
      throw new ForbiddenException('Only the creator can publish this form');
    }

    if (form.status === FormStatus.PUBLISHED) {
      throw new BadRequestException('Form is already published');
    }

    if (form.status === FormStatus.ARCHIVED) {
      throw new BadRequestException('Cannot publish an archived form');
    }

    const updated = await this.formRepo.update(id, tenantId, {
      status: FormStatus.PUBLISHED,
    });

    await this.redis.deleteFormCache(id, form.version);
    return updated;
  }

  async duplicate(id: string, tenantId: string, userId: string): Promise<Form> {
    const original = await this.formRepo.findById(id, tenantId);
    if (!original) throw new NotFoundException('Form not found');

    // Deep copy sections and items
    const sections = await this.prisma.section.findMany({
      where: { formId: id },
      orderBy: { order: 'asc' },
      include: { items: { orderBy: { order: 'asc' } } },
    });

    const newForm = await this.formRepo.create({
      tenantId,
      createdById: userId,
      title: `${original.title} (copy)`,
      description: original.description ?? undefined,
      type: original.type,
      status: FormStatus.DRAFT,
      config: original.config as object,
      version: 1,
      parentFormId: original.id,
    });

    // Duplicate sections and items
    for (const section of sections) {
      const newSection = await this.prisma.section.create({
        data: {
          formId: newForm.id,
          title: section.title,
          order: section.order,
          branchingRules: section.branchingRules ?? undefined,
        },
      });

      for (const item of section.items) {
        await this.prisma.item.create({
          data: {
            sectionId: newSection.id,
            type: item.type,
            order: item.order,
            content: item.content as unknown as import('@prisma/client').Prisma.InputJsonValue,
          },
        });
      }
    }

    return newForm;
  }

  async archive(id: string, tenantId: string, userId: string): Promise<void> {
    const form = await this.formRepo.findById(id, tenantId);
    if (!form) throw new NotFoundException('Form not found');

    if (form.createdById !== userId) {
      throw new ForbiddenException('Only the creator can archive this form');
    }

    await this.formRepo.update(id, tenantId, { status: FormStatus.ARCHIVED });
    await this.redis.deleteFormCache(id, form.version);
  }

  async softDelete(id: string, tenantId: string, userId: string): Promise<void> {
    const form = await this.formRepo.findById(id, tenantId);
    if (!form) throw new NotFoundException('Form not found');

    if (form.createdById !== userId) {
      throw new ForbiddenException('Only the creator can delete this form');
    }

    await this.formRepo.softDelete(id, tenantId);
    await this.redis.deleteFormCache(id, form.version);
  }
}
