import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@shared/prisma/prisma.service';
import { RedisService } from '@shared/redis/redis.service';
import { JwtPayload } from '@shared/types/jwt-payload.type';
import { v4 as uuidv4 } from 'uuid';
import { AuthTokens } from './login.use-case';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redis: RedisService,
  ) {}

  async execute(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Verify refresh token still exists in Redis
    const exists = await this.redis.getRefreshToken(payload.sub, payload.jti);
    if (!exists) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    // Delete old refresh token (rotation)
    await this.redis.deleteRefreshToken(payload.sub, payload.jti);

    // Fetch current user roles
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId: payload.sub, tenantId: payload.tenantId },
      select: { role: true },
    });

    const roles = userRoles.map((r) => r.role as string);
    const newJti = uuidv4();

    const newPayload: JwtPayload = {
      sub: payload.sub,
      tenantId: payload.tenantId,
      roles,
      jti: newJti,
    };

    const [accessToken, newRefreshToken] = await Promise.all([
      this.jwtService.signAsync(newPayload as unknown as Record<string, unknown>, {
        secret: this.configService.getOrThrow<string>('jwt.secret'),
        expiresIn: this.configService.getOrThrow<string>('jwt.accessTtl') as any,
      }),
      this.jwtService.signAsync(newPayload as unknown as Record<string, unknown>, {
        secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
        expiresIn: this.configService.getOrThrow<string>('jwt.refreshTtl') as any,
      }),
    ]);

    const refreshTtlSeconds = this.configService.getOrThrow<number>(
      'jwt.refreshTtlSeconds',
    );
    await this.redis.setRefreshToken(payload.sub, newJti, refreshTtlSeconds);

    return { accessToken, refreshToken: newRefreshToken };
  }
}
