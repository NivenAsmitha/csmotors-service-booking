import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateTodayServicesDisplayDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  enabled: boolean;
}
