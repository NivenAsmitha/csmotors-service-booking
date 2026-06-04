import { BadRequestException, Injectable } from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  readEnabledSetting,
  TODAY_SERVICES_DISPLAY_SETTING_KEY,
} from '../settings/settings.service';

@Injectable()
export class DisplayService {
  constructor(private readonly prisma: PrismaService) {}

  async getTodayServices(dateValue?: string) {
    const setting = await this.prisma.systemSetting.findUnique({
      where: {
        key: TODAY_SERVICES_DISPLAY_SETTING_KEY,
      },
      select: {
        value: true,
      },
    });
    const enabled = readEnabledSetting(setting?.value);
    const date = dateValue ? parseDate(dateValue) : today();
    const dateText = dateKey(date);

    if (!enabled) {
      return {
        enabled: false,
        date: dateText,
        services: [],
      };
    }

    const bookings = await this.prisma.booking.findMany({
      where: {
        status: {
          notIn: [BookingStatus.completed, BookingStatus.cancelled],
        },
        assignment: {
          isNot: null,
        },
        daySlot: {
          date,
        },
      },
      select: displayBookingSelect,
      orderBy: {
        created_at: 'asc',
      },
    });

    return {
      enabled: true,
      date: dateText,
      services: bookings.sort(sortDisplayBookings).map((booking) => ({
        booking_id: booking.id,
        service_name: booking.daySlot.slot.service.name,
        slot_label: booking.daySlot.slot.label,
        bike_number: booking.bike_number,
        bike_model: booking.bike_model,
        employee_name: booking.assignment?.employee.name ?? 'Unassigned',
        status: booking.status,
      })),
    };
  }
}

const displayBookingSelect = {
  id: true,
  status: true,
  bike_number: true,
  bike_model: true,
  created_at: true,
  daySlot: {
    select: {
      date: true,
      slot: {
        select: {
          label: true,
          start_time: true,
          is_default: true,
          service: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  },
  assignment: {
    select: {
      employee: {
        select: {
          name: true,
        },
      },
    },
  },
} satisfies Prisma.BookingSelect;

type DisplayBooking = Prisma.BookingGetPayload<{
  select: typeof displayBookingSelect;
}>;

function sortDisplayBookings(first: DisplayBooking, second: DisplayBooking) {
  if (first.daySlot.slot.is_default !== second.daySlot.slot.is_default) {
    return first.daySlot.slot.is_default ? -1 : 1;
  }

  const firstTime = first.daySlot.slot.start_time?.getTime() ?? 0;
  const secondTime = second.daySlot.slot.start_time?.getTime() ?? 0;

  if (firstTime !== secondTime) {
    return firstTime - secondTime;
  }

  const labelOrder = first.daySlot.slot.label.localeCompare(
    second.daySlot.slot.label,
  );

  if (labelOrder !== 0) {
    return labelOrder;
  }

  return first.created_at.getTime() - second.created_at.getTime();
}

function parseDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException('date must use YYYY-MM-DD format');
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || dateKey(date) !== value) {
    throw new BadRequestException('date must be a valid calendar date');
  }

  return date;
}

function today() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
  );
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
