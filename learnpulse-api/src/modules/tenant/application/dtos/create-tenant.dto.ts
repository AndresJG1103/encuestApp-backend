import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
} from 'class-validator';
import { TenantPlan } from '@prisma/client';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  @Matches(/^[a-z0-9-]+$/, {
    message: 'slug must be lowercase alphanumeric with hyphens',
  })
  slug!: string;

  @IsEnum(TenantPlan)
  @IsOptional()
  plan?: TenantPlan;

  @IsObject()
  @IsOptional()
  settings?: Record<string, unknown>;
}
