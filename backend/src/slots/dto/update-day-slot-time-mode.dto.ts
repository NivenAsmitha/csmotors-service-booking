import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateDaySlotTimeModeDto {
  @ApiProperty({
    example: true,
    nullable: true,
    description: 'Set to null to inherit the default time slot mode.',
  })
  @IsOptional()
  @IsBoolean()
  show_time_override: boolean | null;
}
