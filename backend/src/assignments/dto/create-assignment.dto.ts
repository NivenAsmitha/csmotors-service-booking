import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateAssignmentDto {
  @ApiProperty({ example: 'c62c1260-03ac-4418-bebd-3d7a0c2e258f' })
  @IsUUID()
  booking_id: string;

  @ApiProperty({ example: 'e8662e83-6f60-48a9-b25c-5b1df2e30d9e' })
  @IsUUID()
  employee_id: string;

  @ApiProperty({ example: 'WP ABC-1234' })
  @IsString()
  @MaxLength(100)
  vehicle_ref: string;

  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'scheduled_time must use HH:mm format',
  })
  scheduled_time?: string;
}
