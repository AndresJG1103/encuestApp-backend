import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/prisma/prisma.service';
import { IFormRepository, FindFormsFilter } from '../domain/repositories/form.repository.interface';
import { Form, FormStatus } from '@prisma/client';
import { PaginatedResult, PaginationParams } from '@shared/types/paginated.type';
import { Prisma } from '@prisma/client';

@Injectable()
export class FormPrismaRepository implements IFormRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, tenantId: string): Promise<Form | null> {
    return this.prisma.form.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        sections: {
          where: {},
          orderBy: { order: 'asc' },
          include: {
            items: { orderBy: { order: 'asc' } },
          },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    }) as Promise<Form | null>;
  }

  async findAll(
    filter: FindFormsFilter,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<Form>> {
    const page = pagination.page ?? 1;
    const limit = Math.min(pagination.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.FormWhereInput = {
      tenantId: filter.tenantId,
      deletedAt: null,
      ...(filter.type && { type: filter.type as Form['type'] }),
      ...(filter.status && { status: filter.status as FormStatus }),
      ...(filter.createdById && { createdById: filter.createdById }),
    };

    const [data, total] = await Promise.all([
      this.prisma.form.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.form.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(data: Partial<Form>): Promise<Form> {
    return this.prisma.form.create({
      data: data as Prisma.FormCreateInput,
    });
  }

  async update(id: string, tenantId: string, data: Partial<Form>): Promise<Form> {
    return this.prisma.form.update({
      where: { id },
      data: {
        ...data,
        tenantId, // ensure tenant scope
      } as Prisma.FormUpdateInput,
    });
  }

  async softDelete(id: string, tenantId: string): Promise<void> {
    await this.prisma.form.update({
      where: { id },
      data: { deletedAt: new Date(), tenantId },
    });
  }

  async incrementVersion(id: string, tenantId: string): Promise<Form> {
    return this.prisma.form.update({
      where: { id },
      data: { version: { increment: 1 }, tenantId },
    });
  }
}
