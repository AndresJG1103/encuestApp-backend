import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env['APP_PORT'] ?? '3000', 10),
  corsOrigins: (process.env['CORS_ORIGINS'] ?? 'http://localhost:3001').split(','),
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
}));
