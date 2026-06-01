import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: 'c62c1260-03ac-4418-bebd-3d7a0c2e258f' })
  @IsUUID()
  booking_id: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'Excellent service' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}
