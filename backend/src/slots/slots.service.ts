import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateDaySlotCloseDto } from './dto/update-day-slot-close.dto';
import { UpdateDaySlotTimeModeDto } from './dto/update-day-slot-time-mode.dto';
import { UpdateSlotTimeModeDto } from './dto/update-slot-time-mode.dto';

@Injectable()
export class SlotsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findPublicSlots(serviceId: string, dateValue: string) {
    const date = this.parseDate(dateValue);
    const service = await this.prisma.service.findFirst({
      where: {
        id: serviceId,
        is_active: true,
      },
      include: {
        timeSlots: {
          where: {
            is_default: true,
          },
          orderBy: {
            start_time: 'asc',
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Active service not found');
    }

    const dayClosure = await this.prisma.dayClosure.findUnique({
      where: {
        date,
      },
      select: {
        id: true,
      },
    });
    const daySlots = await this.prisma.$transaction(
      service.timeSlots.map((slot) =>
        this.prisma.daySlot.upsert({
          where: {
            slot_id_date: {
              slot_id: slot.id,
              date,
            },
          },
          update: {},
          create: {
            slot_id: slot.id,
            date,
            max_bookings: service.max_bookings_per_slot,
          },
          include: {
            _count: {
              select: {
                bookings: {
                  where: {
                    status: {
                      not: BookingStatus.cancelled,
                    },
                  },
                },
              },
            },
          },
        }),
      ),
    );
    const daySlotsBySlotId = new Map(
      daySlots.map((daySlot) => [daySlot.slot_id, daySlot]),
    );

    return service.timeSlots.map((slot) => {
      const daySlot = daySlotsBySlotId.get(slot.id)!;
      const bookedCount = daySlot._count.bookings;
      const displayTime = resolveDisplayTime(
        daySlot.show_time_override,
        slot.show_time,
      );
      const reason = dayClosure
        ? 'day_closed'
        : daySlot.is_closed
          ? 'slot_closed'
          : bookedCount >= daySlot.max_bookings
            ? 'fully_booked'
            : undefined;

      return {
        day_slot_id: daySlot.id,
        slot_id: slot.id,
        label: slot.label,
        display_label: displayTime
          ? `${slot.label} (${formatTime(slot.start_time)} - ${formatTime(slot.end_time)})`
          : slot.label,
        display_time: displayTime,
        date: dateValue,
        max_bookings: daySlot.max_bookings,
        booked_count: bookedCount,
        available: !reason,
        is_closed: Boolean(dayClosure) || daySlot.is_closed,
        show_time_override: daySlot.show_time_override,
        ...(reason ? { reason } : {}),
        ...(displayTime
          ? {
              start_time: formatTime(slot.start_time),
              end_time: formatTime(slot.end_time),
            }
          : {}),
      };
    });
  }

  async findConfig() {
    const services = await this.prisma.service.findMany({
      include: {
        timeSlots: {
          orderBy: {
            start_time: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return services.map((service) => ({
      ...service,
      timeSlots: service.timeSlots.map(formatSlotTimes),
    }));
  }

  async updateSlotTimeMode(
    currentUserId: string,
    id: string,
    dto: UpdateSlotTimeModeDto,
  ) {
    const previousSlot = await this.assertTimeSlotExists(id);
    const slot = await this.prisma.timeSlot.update({
      where: {
        id,
      },
      data: {
        show_time: dto.show_time,
      },
    });

    await this.auditService.log({
      userId: currentUserId,
      action: 'SLOT_TIME_MODE_CHANGED',
      entity: 'time_slot',
      entityId: slot.id,
      metadata: {
        old: {
          show_time: previousSlot.show_time,
        },
        new: {
          show_time: slot.show_time,
        },
      },
    });

    return formatSlotTimes(slot);
  }

  async updateDaySlotTimeMode(
    currentUserId: string,
    id: string,
    dto: UpdateDaySlotTimeModeDto,
  ) {
    const previousDaySlot = await this.assertDaySlotExists(id);

    const daySlot = await this.prisma.daySlot.update({
      where: {
        id,
      },
      data: {
        show_time_override: dto.show_time_override,
      },
    });

    await this.auditService.log({
      userId: currentUserId,
      action: 'DAY_SLOT_TIME_MODE_CHANGED',
      entity: 'day_slot',
      entityId: daySlot.id,
      metadata: {
        old: {
          show_time_override: previousDaySlot.show_time_override,
        },
        new: {
          show_time_override: daySlot.show_time_override,
        },
      },
    });

    return daySlot;
  }

  async updateDaySlotClose(
    currentUserId: string,
    id: string,
    dto: UpdateDaySlotCloseDto,
  ) {
    const previousDaySlot = await this.assertDaySlotExists(id);

    const daySlot = await this.prisma.daySlot.update({
      where: {
        id,
      },
      data: {
        is_closed: dto.is_closed,
      },
    });

    await this.auditService.log({
      userId: currentUserId,
      action: daySlot.is_closed ? 'DAY_SLOT_CLOSED' : 'DAY_SLOT_OPENED',
      entity: 'day_slot',
      entityId: daySlot.id,
      metadata: {
        old: {
          is_closed: previousDaySlot.is_closed,
        },
        new: {
          is_closed: daySlot.is_closed,
        },
      },
    });

    return daySlot;
  }

  private parseDate(value: string) {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException('date must use YYYY-MM-DD format');
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    ) {
      throw new BadRequestException('date must be a valid calendar date');
    }

    return date;
  }

  private async assertTimeSlotExists(id: string) {
    const slot = await this.prisma.timeSlot.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        show_time: true,
      },
    });

    if (!slot) {
      throw new NotFoundException('Time slot not found');
    }

    return slot;
  }

  private async assertDaySlotExists(id: string) {
    const daySlot = await this.prisma.daySlot.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        show_time_override: true,
        is_closed: true,
      },
    });

    if (!daySlot) {
      throw new NotFoundException('Day slot not found');
    }

    return daySlot;
  }
}

function formatSlotTimes<T extends { start_time: Date; end_time: Date }>(
  slot: T,
) {
  return {
    ...slot,
    start_time: formatTime(slot.start_time),
    end_time: formatTime(slot.end_time),
  };
}

function formatTime(time: Date) {
  return time.toISOString().slice(11, 16);
}

function resolveDisplayTime(
  showTimeOverride: boolean | null | undefined,
  defaultShowTime: boolean,
) {
  return showTimeOverride !== null && showTimeOverride !== undefined
    ? showTimeOverride
    : defaultShowTime;
}
