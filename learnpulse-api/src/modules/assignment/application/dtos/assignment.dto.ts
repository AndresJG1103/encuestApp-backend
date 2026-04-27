import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { AssignmentStatus } from '@prisma/client';

export class CreateAssignmentDto {
  @IsUUID()
  formId!: string;

  @IsUUID()
  userId!: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;
}

export class UpdateAssignmentDto {
  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsEnum(AssignmentStatus)
  @IsOptional()
  status?: AssignmentStatus;
}
