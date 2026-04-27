import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { FormType } from '@prisma/client';

export class FormConfigDto {
  @IsBoolean()
  @IsOptional()
  sequential?: boolean;

  @IsBoolean()
  @IsOptional()
  allowSkip?: boolean;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  passingScore?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxAttempts?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  timeLimit?: number;

  @IsBoolean()
  @IsOptional()
  shuffleQuestions?: boolean;

  @IsBoolean()
  @IsOptional()
  showResultsAfter?: boolean;

  @IsBoolean()
  @IsOptional()
  certificateOnPass?: boolean;
}

export class CreateFormDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(FormType)
  type!: FormType;

  @IsObject()
  @IsOptional()
  config?: FormConfigDto;
}

export class UpdateFormDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  config?: FormConfigDto;
}
