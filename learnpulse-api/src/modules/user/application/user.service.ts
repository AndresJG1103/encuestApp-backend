import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@shared/prisma/prisma.service';
import { RoleType, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PaginatedResult, PaginationParams } from '@shared/types/paginated.type';
import { CreateUserDto, UpdateUserDto } from './dtos/user.dto';

type SafeUser = Omit<User, 'passwordHash'>;

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateUserDto): Promise<SafeUser> {
    const existing = await this.prisma.user.findFirst({
      where: { email: dto.email, tenantId, deletedAt: null },
    });

    if (existing) throw new BadRequestException('Email already registered');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        tenantId,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        roles: {
          create: dto.roles.map((role) => ({ tenantId, role })),
        },
      },
      include: { roles: true },
    });

    const { passwordHash: _ph, ...safeUser } = user;
    return safeUser;
  }

  async findAll(
    tenantId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<SafeUser>> {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { tenantId, deletedAt: null },
        skip,
        take: limit,
        include: { roles: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where: { tenantId, deletedAt: null } }),
    ]);

    const safeData = data.map(({ passwordHash: _ph, ...u }) => u);

    return {
      data: safeData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, tenantId: string): Promise<SafeUser> {
    const user = await this.prisma.user.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { roles: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const { passwordHash: _ph, ...safeUser } = user;
    return safeUser;
  }

  async update(id: string, tenantId: string, dto: UpdateUserDto): Promise<SafeUser> {
    await this.findById(id, tenantId);

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName && { lastName: dto.lastName }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      include: { roles: true },
    });

    const { passwordHash: _ph, ...safeUser } = user;
    return safeUser;
  }

  async assignRole(id: string, tenantId: string, role: RoleType): Promise<void> {
    await this.findById(id, tenantId);

    await this.prisma.userRole.upsert({
      where: { userId_tenantId_role: { userId: id, tenantId, role } },
      create: { userId: id, tenantId, role },
      update: {},
    });
  }

  async removeRole(id: string, tenantId: string, role: RoleType): Promise<void> {
    await this.prisma.userRole.deleteMany({
      where: { userId: id, tenantId, role },
    });
  }

  async softDelete(id: string, tenantId: string): Promise<void> {
    await this.findById(id, tenantId);
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
