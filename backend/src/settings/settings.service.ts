import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateGlobalTimeModeDto } from './dto/update-global-time-mode.dto';
import { UpdateTodayServicesDisplayDto } from './dto/update-today-services-display.dto';

export const TODAY_SERVICES_DISPLAY_SETTING_KEY =
  'today_services_display_enabled';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getTimeMode() {
    const hiddenSlot = await this.prisma.timeSlot.findFirst({
      where: {
        show_time: false,
      },
      select: {
        id: true,
      },
    });

    return {
      show_time: !hiddenSlot,
    };
  }

  async updateTimeMode(
    currentUserId: string,
    updateGlobalTimeModeDto: UpdateGlobalTimeModeDto,
  ) {
    await this.prisma.$transaction([
      this.prisma.timeSlot.updateMany({
        data: {
          show_time: updateGlobalTimeModeDto.show_time,
        },
      }),
      this.prisma.daySlot.updateMany({
        data: {
          show_time_override: null,
        },
      }),
    ]);

    await this.auditService.log({
      userId: currentUserId,
      action: 'GLOBAL_TIME_MODE_UPDATED',
      entity: 'settings',
      metadata: {
        show_time: updateGlobalTimeModeDto.show_time,
      },
    });

    return {
      show_time: updateGlobalTimeModeDto.show_time,
    };
  }

  async getTodayServicesDisplay() {
    const setting = await this.prisma.systemSetting.findUnique({
      where: {
        key: TODAY_SERVICES_DISPLAY_SETTING_KEY,
      },
      select: {
        value: true,
      },
    });

    return {
      enabled: readEnabledSetting(setting?.value),
    };
  }

  async updateTodayServicesDisplay(
    currentUserId: string,
    updateTodayServicesDisplayDto: UpdateTodayServicesDisplayDto,
  ) {
    const value = {
      enabled: updateTodayServicesDisplayDto.enabled,
    };

    await this.prisma.systemSetting.upsert({
      where: {
        key: TODAY_SERVICES_DISPLAY_SETTING_KEY,
      },
      create: {
        key: TODAY_SERVICES_DISPLAY_SETTING_KEY,
        value,
      },
      update: {
        value,
      },
    });

    await this.auditService.log({
      userId: currentUserId,
      action: 'TODAY_SERVICES_DISPLAY_TOGGLED',
      entity: 'settings',
      metadata: value,
    });

    return value;
  }
}

export function readEnabledSetting(value: unknown) {
  if (
    value &&
    typeof value === 'object' &&
    'enabled' in value &&
    typeof value.enabled === 'boolean'
  ) {
    return value.enabled;
  }

  return true;
}
