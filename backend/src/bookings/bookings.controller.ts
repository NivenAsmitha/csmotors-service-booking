import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { BookingStatus, UserRole } from '@prisma/client';
import { type AuthenticatedUser } from '../auth/auth.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@ApiTags('bookings')
@ApiBearerAuth()
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Roles(UserRole.client)
  @ApiOperation({ summary: 'Create a client booking' })
  @Post()
  create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createBookingDto: CreateBookingDto,
  ) {
    return this.bookingsService.create(currentUser.id, createBookingDto);
  }

  @Roles(
    UserRole.client,
    UserRole.employee,
    UserRole.it_support,
    UserRole.admin,
    UserRole.developer,
  )
  @ApiOperation({ summary: 'List visible bookings' })
  @ApiQuery({ name: 'status', enum: BookingStatus, required: false })
  @ApiQuery({ name: 'date', example: '2026-06-02', required: false })
  @ApiQuery({ name: 'service_id', required: false })
  @Get()
  findAll(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query('status') status?: string,
    @Query('date') date?: string,
    @Query('service_id') serviceId?: string,
  ) {
    return this.bookingsService.findAll(currentUser, {
      status,
      date,
      serviceId,
    });
  }

  @Roles(
    UserRole.client,
    UserRole.employee,
    UserRole.it_support,
    UserRole.admin,
    UserRole.developer,
  )
  @ApiOperation({ summary: 'Get one visible booking' })
  @Get(':id')
  findOne(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.bookingsService.findOne(currentUser, id);
  }

  @Roles(UserRole.client)
  @ApiOperation({ summary: 'Cancel a future client booking' })
  @Patch(':id/cancel')
  cancel(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.bookingsService.cancel(currentUser.id, id);
  }

  @Roles(UserRole.employee, UserRole.it_support, UserRole.admin)
  @ApiOperation({ summary: 'Update a booking status' })
  @Patch(':id/status')
  updateStatus(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateBookingStatusDto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateStatus(
      currentUser,
      id,
      updateBookingStatusDto,
    );
  }
}
