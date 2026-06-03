import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@shared/prisma/prisma.service';
import { Prisma, Tenant } from '@prisma/client';
import { CreateTenantDto } from '../dtos/create-tenant.dto';
import { UpdateTenantDto } from '../dtos/update-tenant.dto';
import { PaginatedResult, PaginationParams } from '@shared/types/paginated.type';

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTenantDto): Promise<Tenant> {
    const existing = await this.prisma.tenant.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new BadRequestException('Slug already taken');
    }

    return this.prisma.tenant.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        plan: dto.plan,
        settings: (dto.settings ?? {}) as unknown as import('@prisma/client').Prisma.InputJsonValue,
      },
    });
  }

  async findById(id: string): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id, deletedAt: null },
    });

    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async findAll(
    params: PaginationParams & { search?: string },
  ): Promise<PaginatedResult<Tenant>> {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.TenantWhereInput = {
      deletedAt: null,
      ...(params.search && {
        OR: [
          { name: { contains: params.search, mode: 'insensitive' } },
          { slug: { contains: params.search, mode: 'insensitive' } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findBySlug(slug: string): Promise<Tenant> {
    const tenant = await this.prisma.tenant.findFirst({
      where: { slug, deletedAt: null },
    });

    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    await this.findById(id);

    return this.prisma.tenant.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.plan && { plan: dto.plan }),
        ...(dto.settings && { settings: dto.settings as unknown as import('@prisma/client').Prisma.InputJsonValue }),
      },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.findById(id);
    await this.prisma.tenant.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
