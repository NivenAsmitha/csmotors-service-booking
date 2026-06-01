import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateSlotTimeModeDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  show_time: boolean;
}
