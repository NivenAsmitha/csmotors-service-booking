import { Module } from '@nestjs/common';
import { DayClosuresController } from './day-closures.controller';
import { DayClosuresService } from './day-closures.service';

@Module({
  controllers: [DayClosuresController],
  providers: [DayClosuresService],
})
export class DayClosuresModule {}
