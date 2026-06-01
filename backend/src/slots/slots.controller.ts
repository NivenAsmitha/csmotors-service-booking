import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { type AuthenticatedUser } from '../auth/auth.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UpdateDaySlotCloseDto } from './dto/update-day-slot-close.dto';
import { UpdateDaySlotTimeModeDto } from './dto/update-day-slot-time-mode.dto';
import { UpdateSlotTimeModeDto } from './dto/update-slot-time-mode.dto';
import { SlotsService } from './slots.service';

@ApiTags('slots')
@Controller()
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Public()
  @ApiOperation({ summary: 'List public service slots for a date' })
  @ApiQuery({ name: 'date', example: '2026-06-01' })
  @Get('services/:serviceId/slots')
  findPublicSlots(
    @Param('serviceId') serviceId: string,
    @Query('date') date: string,
  ) {
    return this.slotsService.findPublicSlots(serviceId, date);
  }

  @ApiBearerAuth()
  @Roles(UserRole.admin, UserRole.developer)
  @ApiOperation({ summary: 'List internal slot configuration' })
  @Get('slots/config')
  findConfig() {
    return this.slotsService.findConfig();
  }

  @ApiBearerAuth()
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Update a default slot time display mode' })
  @Patch('slots/:id/time-mode')
  updateSlotTimeMode(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateSlotTimeModeDto: UpdateSlotTimeModeDto,
  ) {
    return this.slotsService.updateSlotTimeMode(
      currentUser.id,
      id,
      updateSlotTimeModeDto,
    );
  }

  @ApiBearerAuth()
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Override a day slot time display mode' })
  @Patch('day-slots/:id/time-mode')
  updateDaySlotTimeMode(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateDaySlotTimeModeDto: UpdateDaySlotTimeModeDto,
  ) {
    return this.slotsService.updateDaySlotTimeMode(
      currentUser.id,
      id,
      updateDaySlotTimeModeDto,
    );
  }

  @ApiBearerAuth()
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Open or close a day slot' })
  @Patch('day-slots/:id/close')
  updateDaySlotClose(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateDaySlotCloseDto: UpdateDaySlotCloseDto,
  ) {
    return this.slotsService.updateDaySlotClose(
      currentUser.id,
      id,
      updateDaySlotCloseDto,
    );
  }
}
