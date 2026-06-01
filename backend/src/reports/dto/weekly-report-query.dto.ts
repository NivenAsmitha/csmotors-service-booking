import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class WeeklyReportQueryDto {
  @ApiProperty({ example: '2026-06-01' })
  @IsDateString({ strict: true })
  start: string;
}
