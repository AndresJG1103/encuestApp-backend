import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@shared/prisma/prisma.service';
import { Certificate } from '@prisma/client';
import { PaginatedResult, PaginationParams } from '@shared/types/paginated.type';

@Injectable()
export class CertificateService {
  constructor(private readonly prisma: PrismaService) {}

  async findMine(
    userId: string,
    params: PaginationParams,
  ): Promise<PaginatedResult<Certificate>> {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.certificate.findMany({
        where: { userId },
        skip,
        take: limit,
        include: {
          form: { select: { id: true, title: true } },
        },
        orderBy: { issuedAt: 'desc' },
      }),
      this.prisma.certificate.count({ where: { userId } }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string, userId: string): Promise<Certificate> {
    const cert = await this.prisma.certificate.findFirst({
      where: { id, userId },
      include: {
        form: { select: { id: true, title: true } },
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
    if (!cert) throw new NotFoundException('Certificate not found');
    return cert;
  }

  async verifyByCode(code: string): Promise<Certificate> {
    const cert = await this.prisma.certificate.findFirst({
      where: { verificationCode: code },
      include: {
        form: { select: { id: true, title: true } },
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!cert) throw new NotFoundException('Certificate not found');
    return cert;
  }
}
