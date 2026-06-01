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
import { UserRole } from '@prisma/client';
import { type AuthenticatedUser } from '../auth/auth.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';

@ApiTags('assignments')
@ApiBearerAuth()
@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Roles(UserRole.it_support, UserRole.admin)
  @ApiOperation({ summary: 'Assign an employee to a booking' })
  @Post()
  create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createAssignmentDto: CreateAssignmentDto,
  ) {
    return this.assignmentsService.create(currentUser.id, createAssignmentDto);
  }

  @Roles(UserRole.it_support, UserRole.admin)
  @ApiOperation({ summary: 'Update a booking assignment' })
  @Patch(':id')
  update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAssignmentDto: UpdateAssignmentDto,
  ) {
    return this.assignmentsService.update(
      currentUser.id,
      id,
      updateAssignmentDto,
    );
  }

  @Roles(UserRole.it_support, UserRole.admin, UserRole.developer)
  @ApiOperation({ summary: 'Get the internal assignment board for a date' })
  @ApiQuery({ name: 'date', example: '2026-06-02' })
  @Get('board')
  findBoard(@Query('date') date: string) {
    return this.assignmentsService.findBoard(date);
  }

  @Roles(UserRole.employee)
  @ApiOperation({ summary: 'List assignments for the current employee' })
  @ApiQuery({ name: 'date', example: '2026-06-02', required: false })
  @Get('my')
  findMy(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query('date') date?: string,
  ) {
    return this.assignmentsService.findMy(currentUser.id, date);
  }
}
