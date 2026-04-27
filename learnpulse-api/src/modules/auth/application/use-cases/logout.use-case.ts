import { Injectable } from '@nestjs/common';
import { RedisService } from '@shared/redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '@shared/types/jwt-payload.type';

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async execute(user: JwtPayload): Promise<void> {
    // Delete refresh token from Redis
    await this.redis.deleteRefreshToken(user.sub, user.jti);

    // Blacklist the access token until it expires naturally
    const accessTtlSeconds = this.configService.getOrThrow<number>(
      'jwt.accessTtlSeconds',
    );
    await this.redis.blacklistToken(user.jti, accessTtlSeconds);
  }
}
