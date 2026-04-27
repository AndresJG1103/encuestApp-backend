import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { RoleType } from '@prisma/client';

export class CreateUserDto {
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password!: string;

  @IsString()
  @MaxLength(80)
  firstName!: string;

  @IsString()
  @MaxLength(80)
  lastName!: string;

  @IsEnum(RoleType, { each: true })
  roles!: RoleType[];
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @MaxLength(80)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  lastName?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class AssignRoleDto {
  @IsEnum(RoleType)
  role!: RoleType;
}
