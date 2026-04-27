import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly configService: ConfigService) {
    this.client = new Redis(this.configService.getOrThrow<string>('REDIS_URL'), {
      lazyConnect: false,
    });

    this.client.on('connect', () => this.logger.log('Redis connected'));
    this.client.on('error', (err: Error) =>
      this.logger.error('Redis error', err.message),
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  // ─── Refresh token ───────────────────────────────────────────────────
  async setRefreshToken(userId: string, jti: string, ttlSeconds: number): Promise<void> {
    await this.client.set(`rt:${userId}:${jti}`, '1', 'EX', ttlSeconds);
  }

  async getRefreshToken(userId: string, jti: string): Promise<string | null> {
    return this.client.get(`rt:${userId}:${jti}`);
  }

  async deleteRefreshToken(userId: string, jti: string): Promise<void> {
    await this.client.del(`rt:${userId}:${jti}`);
  }

  // ─── Access token blacklist ───────────────────────────────────────────
  async blacklistToken(jti: string, ttlSeconds: number): Promise<void> {
    await this.client.set(`bl:${jti}`, '1', 'EX', ttlSeconds);
  }

  async isTokenBlacklisted(jti: string): Promise<boolean> {
    const result = await this.client.get(`bl:${jti}`);
    return result !== null;
  }

  // ─── Session progress cache ───────────────────────────────────────────
  async setSessionProgress(sessionId: string, data: Record<string, unknown>): Promise<void> {
    await this.client.set(
      `sess:${sessionId}`,
      JSON.stringify(data),
      'EX',
      48 * 60 * 60, // 48 hours
    );
  }

  async getSessionProgress(sessionId: string): Promise<Record<string, unknown> | null> {
    const data = await this.client.get(`sess:${sessionId}`);
    if (!data) return null;
    return JSON.parse(data) as Record<string, unknown>;
  }

  async deleteSessionProgress(sessionId: string): Promise<void> {
    await this.client.del(`sess:${sessionId}`);
  }

  // ─── Form cache ───────────────────────────────────────────────────────
  async setFormCache(formId: string, version: number, data: unknown): Promise<void> {
    await this.client.set(
      `form:${formId}:v${version}`,
      JSON.stringify(data),
      'EX',
      60 * 60, // 1 hour
    );
  }

  async getFormCache(formId: string, version: number): Promise<unknown | null> {
    const data = await this.client.get(`form:${formId}:v${version}`);
    if (!data) return null;
    return JSON.parse(data);
  }

  async deleteFormCache(formId: string, version: number): Promise<void> {
    await this.client.del(`form:${formId}:v${version}`);
  }

  // ─── Rate limiting ────────────────────────────────────────────────────
  async incrementRateLimit(ip: string, endpoint: string): Promise<number> {
    const key = `rl:${ip}:${endpoint}`;
    const count = await this.client.incr(key);
    if (count === 1) {
      await this.client.expire(key, 60); // 1 minute TTL
    }
    return count;
  }

  // ─── Analytics counters ───────────────────────────────────────────────
  async incrementFormStarts(formId: string): Promise<void> {
    await this.client.incr(`stats:${formId}:starts`);
  }

  async incrementFormCompletes(formId: string): Promise<void> {
    await this.client.incr(`stats:${formId}:completes`);
  }

  async getFormStats(formId: string): Promise<{ starts: number; completes: number }> {
    const [starts, completes] = await Promise.all([
      this.client.get(`stats:${formId}:starts`),
      this.client.get(`stats:${formId}:completes`),
    ]);
    return {
      starts: parseInt(starts ?? '0', 10),
      completes: parseInt(completes ?? '0', 10),
    };
  }
}
