import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@shared/prisma/prisma.service';
import { RedisService } from '@shared/redis/redis.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { JwtPayload } from '@shared/types/jwt-payload.type';

export interface LoginDto {
  email: string;
  password: string;
  tenantSlug: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async execute(dto: LoginDto): Promise<AuthTokens> {
    // Find tenant by slug
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: dto.tenantSlug, deletedAt: null },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Find user within tenant
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        tenantId: tenant.id,
        deletedAt: null,
        isActive: true,
      },
      include: { roles: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user.id, tenant.id, user.roles.map((r) => r.role));
  }

  async generateTokens(
    userId: string,
    tenantId: string,
    roles: string[],
  ): Promise<AuthTokens> {
    const jti = uuidv4();

    const payload: JwtPayload = { sub: userId, tenantId, roles, jti };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload as unknown as Record<string, unknown>, {
        secret: this.configService.getOrThrow<string>('jwt.secret'),
        expiresIn: this.configService.getOrThrow<string>('jwt.accessTtl') as any,
      }),
      this.jwtService.signAsync(payload as unknown as Record<string, unknown>, {
        secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
        expiresIn: this.configService.getOrThrow<string>('jwt.refreshTtl') as any,
      }),
    ]);

    // Store refresh token in Redis
    const refreshTtlSeconds = this.configService.getOrThrow<number>(
      'jwt.refreshTtlSeconds',
    );
    await this.redis.setRefreshToken(userId, jti, refreshTtlSeconds);

    return { accessToken, refreshToken };
  }
}
