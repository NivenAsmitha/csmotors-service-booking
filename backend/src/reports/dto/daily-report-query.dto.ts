import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class DailyReportQueryDto {
  @ApiProperty({ example: '2026-06-02' })
  @IsDateString({ strict: true })
  date: string;
}
