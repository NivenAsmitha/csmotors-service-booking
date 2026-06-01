import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateGlobalTimeModeDto } from './dto/update-global-time-mode.dto';

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
}
