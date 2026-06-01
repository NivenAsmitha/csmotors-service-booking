import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class AuditLogQueryDto {
  @ApiPropertyOptional({ example: 'booking' })
  @IsOptional()
  @IsString()
  entity?: string;

  @ApiPropertyOptional({ example: 'BOOKING_CREATED' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ example: 'e8662e83-6f60-48a9-b25c-5b1df2e30d9e' })
  @IsOptional()
  @IsUUID()
  user_id?: string;

  @ApiPropertyOptional({ example: '2026-06-01' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'from must use YYYY-MM-DD format',
  })
  from?: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'to must use YYYY-MM-DD format',
  })
  to?: string;

  @ApiPropertyOptional({ example: 1, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ example: 20, default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}
