import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class SubmitAnswerDto {
  @IsUUID()
  itemId!: string;

  @IsObject()
  @IsNotEmpty()
  answer!: Record<string, unknown>;

  @IsInt()
  @Min(0)
  @IsOptional()
  timeSpentMs?: number;
}
