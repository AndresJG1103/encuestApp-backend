import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  Min,
} from 'class-validator';
import { ItemType } from '@prisma/client';

export class CreateItemDto {
  @IsEnum(ItemType)
  type!: ItemType;

  @IsInt()
  @Min(0)
  order!: number;

  @IsObject()
  @IsNotEmpty()
  content!: Record<string, unknown>;
}

export class UpdateItemDto {
  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;

  @IsObject()
  @IsOptional()
  content?: Record<string, unknown>;
}
