import {
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

export class RegisterDto {
  @ApiProperty({ example: 'demo-corp' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  tenantSlug!: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @ApiProperty({ example: 'Secret123!' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(100)
  password!: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  firstName!: string;

  @ApiProperty({ example: 'García' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  lastName!: string;

  @ApiProperty({ example: '12345678A', description: 'Número de documento de identidad (CC, DNI, pasaporte, etc.)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  identityDocument!: string;

  @ApiPropertyOptional({ enum: RoleType, example: RoleType.RESPONDENT })
  @IsEnum(RoleType)
  @IsOptional()
  role?: RoleType;
}
