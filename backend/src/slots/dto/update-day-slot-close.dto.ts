import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateDaySlotCloseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  is_closed: boolean;
}
