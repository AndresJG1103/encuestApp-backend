import { IsEnum, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { TenantPlan } from '@prisma/client';

export class UpdateTenantDto {
  @IsString()
  @IsOptional()
  @MaxLength(120)
  name?: string;

  @IsEnum(TenantPlan)
  @IsOptional()
  plan?: TenantPlan;

  @IsObject()
  @IsOptional()
  settings?: Record<string, unknown>;
}
