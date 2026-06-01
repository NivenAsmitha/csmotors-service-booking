import { Body, Controller, Get, Patch } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { type AuthenticatedUser } from '../auth/auth.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UpdateGlobalTimeModeDto } from './dto/update-global-time-mode.dto';
import { SettingsService } from './settings.service';

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Roles(UserRole.admin, UserRole.developer)
  @ApiOperation({ summary: 'Get the global client time display mode' })
  @Get('time-mode')
  getTimeMode() {
    return this.settingsService.getTimeMode();
  }

  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Update the global client time display mode' })
  @Patch('time-mode')
  updateTimeMode(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() updateGlobalTimeModeDto: UpdateGlobalTimeModeDto,
  ) {
    return this.settingsService.updateTimeMode(
      currentUser.id,
      updateGlobalTimeModeDto,
    );
  }
}
