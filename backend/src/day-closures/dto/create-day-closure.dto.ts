import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateDayClosureDto {
  @ApiProperty({ example: '2026-06-05' })
  @IsDateString({ strict: true })
  date: string;

  @ApiPropertyOptional({ example: 'Shop closed for maintenance' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
