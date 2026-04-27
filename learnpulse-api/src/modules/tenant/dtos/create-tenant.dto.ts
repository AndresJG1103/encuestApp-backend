import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, Matches } from 'class-validator';
import { TenantPlan } from '@prisma/client';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must be lowercase alphanumeric with dashes' })
  slug!: string;

  @IsEnum(TenantPlan)
  @IsOptional()
  plan?: TenantPlan;

  @IsObject()
  @IsOptional()
  settings?: Record<string, unknown>;
}
