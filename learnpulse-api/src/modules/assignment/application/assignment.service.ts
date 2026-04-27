import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@shared/prisma/prisma.service';
import { Assignment, AssignmentStatus } from '@prisma/client';
import { PaginatedResult, PaginationParams } from '@shared/types/paginated.type';
import { CreateAssignmentDto, UpdateAssignmentDto } from './dtos/assignment.dto';

@Injectable()
export class AssignmentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    tenantId: string,
    assignedById: string,
    dto: CreateAssignmentDto,
  ): Promise<Assignment> {
    // Verify form belongs to tenant
    const form = await this.prisma.form.findFirst({
      where: { id: dto.formId, tenantId, deletedAt: null },
    });
    if (!form) throw new NotFoundException('Form not found');

    // Verify user belongs to tenant
    const user = await this.prisma.user.findFirst({
      where: { id: dto.userId, tenantId, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');

    // Check for duplicate assignment
    const existing = await this.prisma.assignment.findUnique({
      where: { formId_userId: { formId: dto.formId, userId: dto.userId } },
    });
    if (existing)
      throw new BadRequestException('User is already assigned to this form');

    return this.prisma.assignment.create({
      data: {
        formId: dto.formId,
        userId: dto.userId,
        assignedById,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        status: AssignmentStatus.PENDING,
      },
      include: {
        form: { select: { id: true, title: true, type: true } },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });
  }

  async findMine(
    userId: string,
    tenantId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<Assignment>> {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where = {
      userId,
      form: { tenantId, deletedAt: null },
    };

    const [data, total] = await Promise.all([
      this.prisma.assignment.findMany({
        where,
        skip,
        take: limit,
        include: {
          form: { select: { id: true, title: true, type: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.assignment.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async update(
    id: string,
    tenantId: string,
    dto: UpdateAssignmentDto,
  ): Promise<Assignment> {
    const assignment = await this.prisma.assignment.findFirst({
      where: { id, form: { tenantId } },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');

    return this.prisma.assignment.update({
      where: { id },
      data: {
        ...(dto.dueDate && { dueDate: new Date(dto.dueDate) }),
        ...(dto.status && { status: dto.status }),
      },
    });
  }
}
