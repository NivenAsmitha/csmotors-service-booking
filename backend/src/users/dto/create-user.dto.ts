import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Employee One' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'employee@test.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ example: '0771234567' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Password123', minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    enum: [UserRole.admin, UserRole.it_support, UserRole.employee],
    example: UserRole.employee,
  })
  @IsEnum(UserRole)
  role: UserRole;
}
