import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma, UserRole } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { type AuthenticatedUser } from '../auth/auth.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
  ) {}

  async create(clientId: string, createBookingDto: CreateBookingDto) {
    await this.assertVerifiedClient(clientId);

    const booking = await this.runSerializableTransaction(async (tx) => {
      const daySlot = await tx.daySlot.findUnique({
        where: {
          id: createBookingDto.day_slot_id,
        },
        include: {
          slot: {
            include: {
              service: true,
            },
          },
        },
      });

      if (!daySlot) {
        throw new NotFoundException('Day slot not found');
      }

      if (!daySlot.slot.service.is_active) {
        throw new ConflictException('Service is not available');
      }

      if (dateKey(daySlot.date) < todayKey()) {
        throw new BadRequestException(
          'Bookings cannot be created for past dates',
        );
      }

      const dayClosure = await tx.dayClosure.findUnique({
        where: {
          date: daySlot.date,
        },
        select: {
          id: true,
        },
      });

      if (dayClosure) {
        throw new ConflictException('The selected date is closed');
      }

      if (daySlot.is_closed) {
        throw new ConflictException('The selected time slot is closed');
      }

      const bookedCount = await tx.booking.count({
        where: {
          day_slot_id: daySlot.id,
          status: {
            not: BookingStatus.cancelled,
          },
        },
      });

      if (bookedCount >= daySlot.max_bookings) {
        throw new ConflictException('The selected time slot is fully booked');
      }

      const booking = await tx.booking.create({
        data: {
          client_id: clientId,
          day_slot_id: daySlot.id,
          notes: createBookingDto.notes,
          bike_number: createBookingDto.bike_number,
          bike_model: createBookingDto.bike_model,
          status: BookingStatus.confirmed,
        },
        select: bookingSelect,
      });

      return transformBooking(booking, true);
    });

    await this.auditService.log({
      userId: clientId,
      action: 'BOOKING_CREATED',
      entity: 'booking',
      entityId: booking.id,
      metadata: {
        day_slot_id: booking.day_slot_id,
        status: booking.status,
        bike_number: booking.bike_number,
        bike_model: booking.bike_model,
      },
    });
    try {
      await this.notifyItSupport(booking.id);
    } catch {
      this.logger.error('IT Support booking notifications failed');
    }

    return booking;
  }

  async findAll(
    currentUser: AuthenticatedUser,
    filters: {
      status?: string;
      date?: string;
      serviceId?: string;
    },
  ) {
    const where: Prisma.BookingWhereInput = {
      ...this.visibilityWhere(currentUser),
    };

    if (filters.status) {
      where.status = this.parseStatus(filters.status);
    }

    if (filters.date || filters.serviceId) {
      where.daySlot = {
        ...(filters.date ? { date: this.parseDate(filters.date) } : {}),
        ...(filters.serviceId
          ? {
              slot: {
                service_id: filters.serviceId,
              },
            }
          : {}),
      };
    }

    const bookings = await this.prisma.booking.findMany({
      where,
      select: bookingSelect,
      orderBy: {
        created_at: 'desc',
      },
    });

    return bookings.map((booking) =>
      transformBooking(booking, currentUser.role === UserRole.client),
    );
  }

  async findOne(currentUser: AuthenticatedUser, id: string) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        id,
        ...this.visibilityWhere(currentUser),
      },
      select: bookingSelect,
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return transformBooking(booking, currentUser.role === UserRole.client);
  }

  async cancel(clientId: string, id: string) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        id,
        client_id: clientId,
      },
      select: {
        id: true,
        status: true,
        daySlot: {
          select: {
            date: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === BookingStatus.cancelled) {
      throw new ConflictException('Booking is already cancelled');
    }

    if (dateKey(booking.daySlot.date) <= todayKey()) {
      throw new BadRequestException(
        'Bookings cannot be cancelled on or after the service date',
      );
    }

    const updatedBooking = await this.prisma.booking.update({
      where: {
        id: booking.id,
      },
      data: {
        status: BookingStatus.cancelled,
      },
      select: bookingSelect,
    });

    await this.auditService.log({
      userId: clientId,
      action: 'BOOKING_CANCELLED',
      entity: 'booking',
      entityId: updatedBooking.id,
      metadata: {
        old: {
          status: booking.status,
        },
        new: {
          status: updatedBooking.status,
        },
      },
    });

    return transformBooking(updatedBooking, true);
  }

  async updateStatus(
    currentUser: AuthenticatedUser,
    id: string,
    updateBookingStatusDto: UpdateBookingStatusDto,
  ) {
    if (currentUser.role === UserRole.employee) {
      throw new ForbiddenException(
        'Employees cannot update booking status. IT Support must update service status.',
      );
    }

    const booking = await this.prisma.booking.findFirst({
      where: {
        id,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    const updatedBooking = await this.prisma.booking.update({
      where: {
        id: booking.id,
      },
      data: {
        status: updateBookingStatusDto.status,
      },
      select: bookingSelect,
    });

    await this.auditService.log({
      userId: currentUser.id,
      action: 'BOOKING_STATUS_CHANGED',
      entity: 'booking',
      entityId: updatedBooking.id,
      metadata: {
        old: {
          status: booking.status,
        },
        new: {
          status: updatedBooking.status,
        },
      },
    });

    if (
      booking.status !== BookingStatus.completed &&
      updatedBooking.status === BookingStatus.completed
    ) {
      await this.notifyClientServiceCompleted(updatedBooking.id);
    }

    return transformBooking(updatedBooking, false);
  }

  private visibilityWhere(currentUser: AuthenticatedUser) {
    if (currentUser.role === UserRole.client) {
      return {
        client_id: currentUser.id,
      };
    }

    if (currentUser.role === UserRole.employee) {
      return {
        assignment: {
          employee_id: currentUser.id,
        },
      };
    }

    return {};
  }

  private async assertVerifiedClient(clientId: string) {
    const client = await this.prisma.user.findFirst({
      where: {
        id: clientId,
        role: UserRole.client,
        is_active: true,
        email_verified: true,
      },
      select: {
        id: true,
      },
    });

    if (!client) {
      throw new ForbiddenException(
        'Please verify your email before creating a booking',
      );
    }
  }

  private async notifyItSupport(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: {
        id: bookingId,
      },
      select: {
        id: true,
        status: true,
        notes: true,
        bike_number: true,
        bike_model: true,
        client: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        daySlot: {
          select: {
            date: true,
            slot: {
              select: {
                label: true,
                start_time: true,
                end_time: true,
                service: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return;
    }

    const recipients = await this.prisma.user.findMany({
      where: {
        role: UserRole.it_support,
        is_active: true,
        email_verified: true,
      },
      select: {
        id: true,
        email: true,
      },
    });
    const slot = booking.daySlot.slot;

    await Promise.all(
      recipients.map(async (recipient) => {
        try {
          await this.emailService.sendNewBookingToItSupport(recipient.email, {
            bookingId: booking.id,
            clientName: booking.client.name,
            clientEmail: booking.client.email,
            clientPhone: booking.client.phone,
            serviceName: slot.service.name,
            bookingDate: dateKey(booking.daySlot.date),
            slotLabel: slot.label,
            startTime: formatTime(slot.start_time),
            endTime: formatTime(slot.end_time),
            bikeNumber: booking.bike_number,
            bikeModel: booking.bike_model,
            notes: booking.notes,
            status: booking.status,
          });
          await this.auditService.log({
            userId: recipient.id,
            action: 'booking.it_support_email_sent',
            entity: 'booking',
            entityId: booking.id,
            metadata: {
              recipient: recipient.email,
            },
          });
        } catch {
          this.logger.error('IT Support booking notification failed');
          await this.auditService.log({
            userId: recipient.id,
            action: 'booking.it_support_email_failed',
            entity: 'booking',
            entityId: booking.id,
            metadata: {
              recipient: recipient.email,
            },
          });
        }
      }),
    );
  }

  private async notifyClientServiceCompleted(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: {
        id: bookingId,
      },
      select: {
        id: true,
        status: true,
        bike_number: true,
        bike_model: true,
        client: {
          select: {
            name: true,
            email: true,
          },
        },
        daySlot: {
          select: {
            date: true,
            slot: {
              select: {
                label: true,
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
      },
    });

    if (!booking) {
      return;
    }

    try {
      await this.emailService.sendServiceCompletedToClient(
        booking.client.email,
        {
          bookingId: booking.id,
          clientName: booking.client.name,
          serviceName: booking.daySlot.slot.service.name,
          bookingDate: dateKey(booking.daySlot.date),
          slotLabel: booking.daySlot.slot.label,
          bikeNumber: booking.bike_number,
          bikeModel: booking.bike_model,
          employeeName: booking.assignment?.employee.name,
          status: booking.status,
        },
      );
      await this.auditService.log({
        action: 'SERVICE_COMPLETION_EMAIL_SENT',
        entity: 'booking',
        entityId: booking.id,
        metadata: {
          recipient: booking.client.email,
        },
      });
    } catch {
      this.logger.error('Service completion email failed');
      await this.auditService.log({
        action: 'SERVICE_COMPLETION_EMAIL_FAILED',
        entity: 'booking',
        entityId: booking.id,
        metadata: {
          recipient: booking.client.email,
        },
      });
    }
  }

  private parseStatus(value: string) {
    if (!Object.values(BookingStatus).includes(value as BookingStatus)) {
      throw new BadRequestException('status is invalid');
    }

    return value as BookingStatus;
  }

  private parseDate(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw new BadRequestException('date must use YYYY-MM-DD format');
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    if (Number.isNaN(date.getTime()) || dateKey(date) !== value) {
      throw new BadRequestException('date must be a valid calendar date');
    }

    return date;
  }

  private async runSerializableTransaction<T>(
    action: (tx: Prisma.TransactionClient) => Promise<T>,
  ) {
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await this.prisma.$transaction(action, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error) {
        const isSerializationConflict =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034';

        if (!isSerializationConflict) {
          throw error;
        }

        if (attempt === maxAttempts) {
          throw new ConflictException(
            'Could not reserve the selected time slot',
          );
        }
      }
    }

    throw new ConflictException('Could not reserve the selected time slot');
  }
}

const basicClientSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
} satisfies Prisma.UserSelect;

const bookingSelect = {
  id: true,
  client_id: true,
  day_slot_id: true,
  status: true,
  notes: true,
  bike_number: true,
  bike_model: true,
  created_at: true,
  updated_at: true,
  client: {
    select: basicClientSelect,
  },
  daySlot: {
    select: {
      id: true,
      slot_id: true,
      date: true,
      max_bookings: true,
      is_closed: true,
      show_time_override: true,
      slot: {
        select: {
          id: true,
          service_id: true,
          label: true,
          start_time: true,
          end_time: true,
          is_default: true,
          show_time: true,
          service: true,
        },
      },
    },
  },
  assignment: true,
  review: true,
} satisfies Prisma.BookingSelect;

type BookingResponseSource = Prisma.BookingGetPayload<{
  select: typeof bookingSelect;
}>;

function transformBooking(booking: BookingResponseSource, isClient: boolean) {
  const { slot } = booking.daySlot;
  const { start_time, end_time, ...slotWithoutTimes } = slot;
  const displayTime = resolveDisplayTime(
    booking.daySlot.show_time_override,
    slot.show_time,
  );
  const formattedStartTime = formatTime(start_time);
  const formattedEndTime = formatTime(end_time);

  return {
    ...booking,
    daySlot: {
      ...booking.daySlot,
      date: dateKey(booking.daySlot.date),
      slot: {
        ...slotWithoutTimes,
        display_time: displayTime,
        display_label: displayTime
          ? `${slot.label} (${formattedStartTime} - ${formattedEndTime})`
          : slot.label,
        ...(!isClient || displayTime
          ? {
              start_time: formattedStartTime,
              end_time: formattedEndTime,
            }
          : {}),
      },
    },
  };
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function todayKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
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
