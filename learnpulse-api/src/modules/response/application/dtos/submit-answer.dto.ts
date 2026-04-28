import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitAnswerDto {
  @IsUUID()
  itemId!: string;

  @ApiProperty({
    description: 'Answer payload — shape depends on question type',
    example: { value: 'option-a' },
  })
  @IsObject()
  @IsNotEmpty()
  answer!: Record<string, unknown>;

  @IsInt()
  @Min(0)
  @IsOptional()
  timeSpentMs?: number;
}
