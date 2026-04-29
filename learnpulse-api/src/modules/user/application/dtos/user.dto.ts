import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoleType } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'Secret123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password!: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @MaxLength(80)
  firstName!: string;

  @ApiProperty({ example: 'García' })
  @IsString()
  @MaxLength(80)
  lastName!: string;

  @ApiProperty({ example: '12345678A', description: 'Número de documento de identidad' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  identityDocument!: string;

  @ApiProperty({ enum: RoleType, isArray: true, example: [RoleType.RESPONDENT] })
  @IsEnum(RoleType, { each: true })
  roles!: RoleType[];
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Juan' })
  @IsString()
  @IsOptional()
  @MaxLength(80)
  firstName?: string;

  @ApiPropertyOptional({ example: 'García' })
  @IsString()
  @IsOptional()
  @MaxLength(80)
  lastName?: string;

  @ApiPropertyOptional({ example: '12345678A', description: 'Número de documento de identidad' })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  identityDocument?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class AssignRoleDto {
  @ApiProperty({ enum: RoleType, example: RoleType.RESPONDENT })
  @IsEnum(RoleType)
  role!: RoleType;
}
