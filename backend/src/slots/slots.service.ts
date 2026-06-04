import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExtraDaySlotDto } from './dto/create-extra-day-slot.dto';
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
    const defaultDaySlots = await this.prisma.$transaction(
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
            slot: true,
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
    const extraDaySlots = await this.prisma.daySlot.findMany({
      where: {
        date,
        slot: {
          service_id: serviceId,
          is_default: false,
        },
      },
      include: {
        slot: true,
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
    });

    return [...defaultDaySlots, ...extraDaySlots]
      .sort(compareDaySlots)
      .map((daySlot) => formatDaySlotResponse(daySlot, dateValue, Boolean(dayClosure)));
  }

  async createExtraDaySlot(
    currentUserId: string,
    dto: CreateExtraDaySlotDto,
  ) {
    const date = this.parseDate(dto.date);
    const service = await this.prisma.service.findFirst({
      where: {
        id: dto.service_id,
        is_active: true,
      },
      select: {
        id: true,
        name: true,
        max_bookings_per_slot: true,
      },
    });

    if (!service) {
      throw new NotFoundException('Active service not found');
    }

    const maxBookings = service.max_bookings_per_slot;
    const existingExtraSlots = await this.prisma.daySlot.count({
      where: {
        date,
        slot: {
          service_id: dto.service_id,
          is_default: false,
        },
      },
    });

    const createdDaySlots = await this.prisma.$transaction(async (tx) => {
      const daySlots: CreatedExtraDaySlot[] = [];

      for (let index = 1; index <= dto.extra_count; index += 1) {
        const label = `Extra Slot ${existingExtraSlots + index}`;
        const slot = await tx.timeSlot.create({
          data: {
            service_id: dto.service_id,
            label,
            start_time: null,
            end_time: null,
            is_default: false,
            show_time: false,
          },
        });

        daySlots.push(
          await tx.daySlot.create({
            data: {
              slot_id: slot.id,
              date,
              max_bookings: maxBookings,
              is_closed: false,
              show_time_override: dto.show_time_override ?? null,
              created_by: currentUserId,
            },
            include: {
              slot: {
                include: {
                  service: true,
                },
              },
            },
          }),
        );
      }

      return daySlots;
    });
    const createdSlotLabels = createdDaySlots.map((daySlot) => daySlot.slot.label);

    await this.auditService.log({
      userId: currentUserId,
      action: 'EXTRA_DAY_SLOTS_CREATED',
      entity: 'day_slot',
      entityId: createdDaySlots[0]?.id,
      metadata: {
        service_id: dto.service_id,
        service_name: service.name,
        date: dto.date,
        extra_count: dto.extra_count,
        max_bookings_per_slot: service.max_bookings_per_slot,
        created_slot_labels: createdSlotLabels,
      },
    });

    return createdDaySlots.map((daySlot) => ({
      ...daySlot,
      date: dateKey(daySlot.date),
      slot: formatSlotTimes(daySlot.slot),
    }));
  }

  async findConfig() {
    const services = await this.prisma.service.findMany({
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

function formatSlotTimes<T extends { start_time: Date | null; end_time: Date | null }>(
  slot: T,
) {
  return {
    ...slot,
    start_time: formatOptionalTime(slot.start_time),
    end_time: formatOptionalTime(slot.end_time),
  };
}

function formatTime(time: Date) {
  return time.toISOString().slice(11, 16);
}

function formatOptionalTime(time: Date | null) {
  return time ? formatTime(time) : null;
}

type DaySlotWithSlotAndCount = Prisma.DaySlotGetPayload<{
  include: {
    slot: true;
    _count: {
      select: {
        bookings: true;
      };
    };
  };
}>;

type CreatedExtraDaySlot = Prisma.DaySlotGetPayload<{
  include: {
    slot: {
      include: {
        service: true;
      };
    };
  };
}>;

function formatDaySlotResponse(
  daySlot: DaySlotWithSlotAndCount,
  dateValue: string,
  isDayClosed: boolean,
) {
  const slot = daySlot.slot;
  const bookedCount = daySlot._count.bookings;
  const displayTime = resolveDisplayTime(
    daySlot.show_time_override,
    slot.show_time,
  );
  const reason = isDayClosed
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
    display_label: displayTime && slot.start_time && slot.end_time
      ? `${slot.label} (${formatTime(slot.start_time)} - ${formatTime(slot.end_time)})`
      : slot.label,
    display_time: displayTime,
    date: dateValue,
    max_bookings: daySlot.max_bookings,
    booked_count: bookedCount,
    available: !reason,
    is_closed: isDayClosed || daySlot.is_closed,
    is_extra: !slot.is_default,
    show_time_override: daySlot.show_time_override,
    ...(slot.start_time && slot.end_time
      ? {
          start_time: formatTime(slot.start_time),
          end_time: formatTime(slot.end_time),
        }
      : {}),
    ...(reason ? { reason } : {}),
  };
}

function compareDaySlots(left: DaySlotWithSlotAndCount, right: DaySlotWithSlotAndCount) {
  if (left.slot.is_default !== right.slot.is_default) {
    return left.slot.is_default ? -1 : 1;
  }

  if (left.slot.start_time && right.slot.start_time) {
    return left.slot.start_time.getTime() - right.slot.start_time.getTime();
  }

  if (left.slot.start_time) {
    return -1;
  }

  if (right.slot.start_time) {
    return 1;
  }

  return left.slot.label.localeCompare(right.slot.label, undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function resolveDisplayTime(
  showTimeOverride: boolean | null | undefined,
  defaultShowTime: boolean,
) {
  return showTimeOverride !== null && showTimeOverride !== undefined
    ? showTimeOverride
    : defaultShowTime;
}
