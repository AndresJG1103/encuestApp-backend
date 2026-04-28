import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  Min,
} from 'class-validator';
import { ItemType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateItemDto {
  @IsEnum(ItemType)
  type!: ItemType;

  @IsInt()
  @Min(0)
  order!: number;

  @ApiProperty({
    description: 'Item content — shape depends on ItemType. For QUESTION: { questionType, text, options?, correctAnswers?, points? }',
    example: { questionType: 'SINGLE_CHOICE', text: 'What is 2+2?', options: ['3','4','5'], correctAnswers: ['4'], points: 1 },
  })
  @IsObject()
  @IsNotEmpty()
  content!: Record<string, unknown>;
}

export class UpdateItemDto {
  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;

  @ApiProperty({
    description: 'Partial item content update',
    example: { questionType: 'SINGLE_CHOICE', text: 'Updated text?' },
  })
  @IsObject()
  @IsOptional()
  content?: Record<string, unknown>;
}
