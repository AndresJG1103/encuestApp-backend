import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@shared/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { RoleType } from '@prisma/client';

export interface RegisterDto {
  tenantSlug: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: RoleType;
}

@Injectable()
export class RegisterUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: RegisterDto): Promise<{ id: string; email: string }> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.tenantSlug, deletedAt: null },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Check if email already exists within this tenant
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email, tenantId: tenant.id, deletedAt: null },
    });

    if (existing) {
      throw new BadRequestException('Email already registered in this tenant');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        roles: {
          create: {
            tenantId: tenant.id,
            role: dto.role ?? RoleType.RESPONDENT,
          },
        },
      },
      select: { id: true, email: true },
    });

    return user;
  }
}
