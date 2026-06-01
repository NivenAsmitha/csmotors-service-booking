import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 'a8462046-e690-40e8-8594-da222ef61068' })
  @IsUUID()
  day_slot_id: string;

  @ApiPropertyOptional({ example: 'Please call before starting the service.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiProperty({ example: 'WP ABC-1234', maxLength: 30 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  bike_number: string;

  @ApiProperty({ example: 'Pulsar N160', maxLength: 80 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  bike_model: string;
}
