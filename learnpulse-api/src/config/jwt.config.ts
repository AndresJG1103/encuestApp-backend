import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env['JWT_SECRET'],
  refreshSecret: process.env['JWT_REFRESH_SECRET'],
  accessTtl: process.env['JWT_ACCESS_TTL'] ?? '15m',
  refreshTtl: process.env['JWT_REFRESH_TTL'] ?? '7d',
  // Access token TTL in seconds for Redis blacklist
  accessTtlSeconds: 15 * 60,
  // Refresh token TTL in seconds for Redis
  refreshTtlSeconds: 7 * 24 * 60 * 60,
}));
