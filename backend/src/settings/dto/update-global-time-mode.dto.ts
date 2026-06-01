import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateGlobalTimeModeDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  show_time: boolean;
}
