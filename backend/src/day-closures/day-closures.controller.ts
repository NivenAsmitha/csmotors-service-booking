import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { type AuthenticatedUser } from '../auth/auth.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { DayClosuresService } from './day-closures.service';
import { CreateDayClosureDto } from './dto/create-day-closure.dto';

@ApiTags('day-closures')
@ApiBearerAuth()
@Controller('day-closures')
export class DayClosuresController {
  constructor(private readonly dayClosuresService: DayClosuresService) {}

  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Close a date for all services' })
  @Post()
  create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createDayClosureDto: CreateDayClosureDto,
  ) {
    return this.dayClosuresService.create(currentUser.id, createDayClosureDto);
  }

  @Roles(UserRole.admin, UserRole.developer)
  @ApiOperation({ summary: 'List day closures or get one closure by date' })
  @ApiQuery({ name: 'date', example: '2026-06-05', required: false })
  @Get()
  findAll(@Query('date') date?: string) {
    return this.dayClosuresService.findAll(date);
  }

  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Remove a day closure' })
  @Delete(':date')
  remove(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('date') date: string,
  ) {
    return this.dayClosuresService.remove(currentUser.id, date);
  }
}
