import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, Matches } from 'class-validator';

export class UpdateAssignmentDto {
  @ApiPropertyOptional({ example: 'e8662e83-6f60-48a9-b25c-5b1df2e30d9e' })
  @IsOptional()
  @IsUUID()
  employee_id?: string;

  @ApiPropertyOptional({ example: '10:30' })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'scheduled_time must use HH:mm format',
  })
  scheduled_time?: string;
}
