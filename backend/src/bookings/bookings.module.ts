import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';

@Module({
  imports: [EmailModule],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
