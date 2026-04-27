import { Module } from '@nestjs/common';
import { TenantService } from './application/tenant.service';
import { TenantController } from './presentation/tenant.controller';

@Module({
  providers: [TenantService],
  controllers: [TenantController],
  exports: [TenantService],
})
export class TenantModule {}
