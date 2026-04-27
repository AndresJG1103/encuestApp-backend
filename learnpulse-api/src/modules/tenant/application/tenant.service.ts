import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@shared/prisma/prisma.service';
import { Tenant } from '@prisma/client';
import { CreateTenantDto } from '../dtos/create-tenant.dto';
import { UpdateTenantDto } from '../dtos/update-tenant.dto';

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
