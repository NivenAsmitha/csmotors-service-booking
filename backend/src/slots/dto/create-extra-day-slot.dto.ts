import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsUUID,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateExtraDaySlotDto {
  @ApiProperty({ example: '2f62d072-4fc3-48bd-8c03-ec28e0ee36a1' })
  @IsUUID()
  service_id: string;

  @ApiProperty({ example: '2026-06-10' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date: string;

  @ApiProperty({ example: 3, minimum: 1, maximum: 20 })
  @IsInt()
  @Min(1)
  @Max(20)
  extra_count: number;

  @ApiPropertyOptional({
    example: null,
    nullable: true,
    description: 'Set to null or omit to inherit the slot time display mode.',
  })
  @IsOptional()
  @IsBoolean()
  show_time_override?: boolean | null;
}
