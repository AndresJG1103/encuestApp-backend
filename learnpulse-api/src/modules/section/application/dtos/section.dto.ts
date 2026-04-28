import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class BranchingRuleDto {
  @IsUUID()
  questionItemId!: string;

  @IsString()
  condition!: string;

  @ApiProperty({ description: 'Condition value (string or number)', example: 'yes' })
  value!: string | number;

  @IsUUID()
  goToSectionId!: string;
}

export class CreateSectionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsInt()
  @Min(0)
  order!: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BranchingRuleDto)
  branchingRules?: BranchingRuleDto[];
}

export class UpdateSectionDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  order?: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BranchingRuleDto)
  branchingRules?: BranchingRuleDto[];
}

export class ReorderItemsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  orderedItemIds!: string[];
}
