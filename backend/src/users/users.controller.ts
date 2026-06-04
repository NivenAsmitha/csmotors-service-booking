import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { type AuthenticatedUser } from '../auth/auth.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { ResetUserPasswordDto } from './dto/reset-user-password.dto';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@Roles(UserRole.developer, UserRole.admin)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'List all users' })
  @Get()
  findAll(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.usersService.findAll(currentUser.role);
  }

  @ApiOperation({ summary: 'Get the authenticated user profile' })
  @Roles(
    UserRole.developer,
    UserRole.admin,
    UserRole.it_support,
    UserRole.employee,
    UserRole.client,
  )
  @Get('me')
  getMe(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.usersService.findOne(currentUser.id);
  }

  @ApiOperation({ summary: 'Update the authenticated user profile' })
  @ApiResponse({
    status: 200,
    description:
      'Profile updated. If email changed, a new verification OTP is sent.',
  })
  @Patch('me')
  @Roles(
    UserRole.developer,
    UserRole.admin,
    UserRole.it_support,
    UserRole.employee,
    UserRole.client,
  )
  updateMe(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() updateMyProfileDto: UpdateMyProfileDto,
  ) {
    return this.usersService.updateMyProfile(
      currentUser.id,
      updateMyProfileDto,
    );
  }

  @ApiOperation({ summary: 'List active employees for assignment selection' })
  @Roles(UserRole.developer, UserRole.admin, UserRole.it_support)
  @Get('employees/active')
  findActiveEmployees() {
    return this.usersService.findActiveEmployees();
  }

  @ApiOperation({ summary: 'Get one user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @Roles(UserRole.developer, UserRole.admin)
  @Get(':id')
  findOne(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.usersService.findOneForManagement(id, currentUser.role);
  }

  @ApiOperation({ summary: 'Create an internal user' })
  @Roles(UserRole.developer, UserRole.admin)
  @Post()
  create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.usersService.create(
      currentUser.id,
      currentUser.role,
      createUserDto,
    );
  }

  @ApiOperation({ summary: 'Reset a user password as a developer' })
  @ApiResponse({
    status: 403,
    description: 'Developer accounts are protected.',
  })
  @ApiParam({ name: 'id', description: 'User ID' })
  @Roles(UserRole.developer)
  @Patch(':id/password')
  resetPassword(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() resetUserPasswordDto: ResetUserPasswordDto,
  ) {
    return this.usersService.resetPasswordByDeveloper(
      currentUser.id,
      id,
      resetUserPasswordDto,
    );
  }

  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @Roles(UserRole.developer, UserRole.admin)
  @Patch(':id')
  update(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(
      currentUser.id,
      currentUser.role,
      id,
      updateUserDto,
    );
  }

  @ApiOperation({ summary: 'Soft delete a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @Roles(UserRole.developer, UserRole.admin)
  @Delete(':id')
  remove(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.usersService.remove(currentUser.id, currentUser.role, id);
  }
}
