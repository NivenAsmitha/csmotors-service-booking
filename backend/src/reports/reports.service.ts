import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDaily(dateValue: string) {
    const date = parseDate(dateValue);
    const bookings = await this.prisma.booking.findMany({
      where: {
        daySlot: {
          date,
        },
      },
      select: reportBookingSelect,
    });
    const employeeAssignments = await this.prisma.assignment.count({
      where: {
        booking: {
          daySlot: {
            date,
          },
        },
      },
    });
    const summary = summarizeBookings(bookings);

    return {
      date: dateValue,
      total_bookings: bookings.length,
      confirmed_count: summary.bookings_by_status.confirmed,
      pending_count: summary.bookings_by_status.pending,
      in_progress_count: summary.bookings_by_status.in_progress,
      completed_count: summary.bookings_by_status.completed,
      cancelled_count: summary.bookings_by_status.cancelled,
      bookings_by_service: summary.bookings_by_service,
      employee_assignments: employeeAssignments,
      average_rating: summary.average_rating,
      reviews_count: summary.reviews_count,
    };
  }

  async getWeekly(startValue: string) {
    const start = parseDate(startValue);
    const endExclusive = addDays(start, 7);
    const bookings = await this.findBookingsInRange(start, endExclusive);
    const summary = summarizeBookings(bookings);

    return {
      start_date: dateKey(start),
      end_date: dateKey(addDays(start, 6)),
      total_bookings: bookings.length,
      bookings_by_day: countBookingsByDay(bookings, start, 7),
      bookings_by_status: summary.bookings_by_status,
      bookings_by_service: summary.bookings_by_service,
      completed_count: summary.bookings_by_status.completed,
      cancelled_count: summary.bookings_by_status.cancelled,
      average_rating: summary.average_rating,
    };
  }

  async getMonthly(year: number, month: number) {
    const start = new Date(Date.UTC(year, month - 1, 1));
    const endExclusive = new Date(Date.UTC(year, month, 1));
    const daysInMonth = Math.round(
      (endExclusive.getTime() - start.getTime()) / millisecondsPerDay,
    );
    const bookings = await this.findBookingsInRange(start, endExclusive);
    const summary = summarizeBookings(bookings);

    return {
      year,
      month,
      total_bookings: bookings.length,
      bookings_by_day: countBookingsByDay(bookings, start, daysInMonth),
      bookings_by_status: summary.bookings_by_status,
      bookings_by_service: summary.bookings_by_service,
      completed_count: summary.bookings_by_status.completed,
      cancelled_count: summary.bookings_by_status.cancelled,
      reviews_count: summary.reviews_count,
      average_rating: summary.average_rating,
    };
  }

  async getEmployee(id: string) {
    const employee = await this.prisma.user.findFirst({
      where: {
        id,
        role: UserRole.employee,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const [assignments, rating] = await Promise.all([
      this.prisma.assignment.findMany({
        where: {
          employee_id: id,
        },
        select: employeeAssignmentSelect,
        orderBy: {
          assigned_at: 'desc',
        },
      }),
      this.prisma.review.aggregate({
        where: {
          employee_id: id,
        },
        _avg: {
          rating: true,
        },
        _count: {
          _all: true,
        },
      }),
    ]);
    const statusCounts = countStatuses(
      assignments.map((assignment) => assignment.booking.status),
    );

    return {
      employee_id: employee.id,
      employee_name: employee.name,
      employee_email: employee.email,
      assigned_count: assignments.length,
      completed_count: statusCounts.completed,
      in_progress_count: statusCounts.in_progress,
      cancelled_count: statusCounts.cancelled,
      average_rating: normalizeAverage(rating._avg.rating),
      reviews_count: rating._count._all,
      recent_assignments: assignments.slice(0, 10).map(transformAssignment),
    };
  }

  async getSummary() {
    const today = parseDate(localTodayKey());
    const [
      totalUsers,
      totalClients,
      totalEmployees,
      totalBookings,
      todayBookings,
      pendingBookings,
      completedBookings,
      cancelledBookings,
      rating,
      activeServicesCount,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({
        where: {
          role: UserRole.client,
        },
      }),
      this.prisma.user.count({
        where: {
          role: UserRole.employee,
        },
      }),
      this.prisma.booking.count(),
      this.prisma.booking.count({
        where: {
          daySlot: {
            date: today,
          },
        },
      }),
      this.prisma.booking.count({
        where: {
          status: BookingStatus.pending,
        },
      }),
      this.prisma.booking.count({
        where: {
          status: BookingStatus.completed,
        },
      }),
      this.prisma.booking.count({
        where: {
          status: BookingStatus.cancelled,
        },
      }),
      this.prisma.review.aggregate({
        _avg: {
          rating: true,
        },
      }),
      this.prisma.service.count({
        where: {
          is_active: true,
        },
      }),
    ]);

    return {
      total_users: totalUsers,
      total_clients: totalClients,
      total_employees: totalEmployees,
      total_bookings: totalBookings,
      today_bookings: todayBookings,
      pending_bookings: pendingBookings,
      completed_bookings: completedBookings,
      cancelled_bookings: cancelledBookings,
      average_rating: normalizeAverage(rating._avg.rating),
      active_services_count: activeServicesCount,
    };
  }

  private findBookingsInRange(start: Date, endExclusive: Date) {
    return this.prisma.booking.findMany({
      where: {
        daySlot: {
          date: {
            gte: start,
            lt: endExclusive,
          },
        },
      },
      select: reportBookingSelect,
    });
  }
}

const reportBookingSelect = {
  status: true,
  review: {
    select: {
      rating: true,
    },
  },
  daySlot: {
    select: {
      date: true,
      slot: {
        select: {
          service: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.BookingSelect;

const employeeAssignmentSelect = {
  id: true,
  vehicle_ref: true,
  scheduled_time: true,
  assigned_at: true,
  booking: {
    select: {
      id: true,
      status: true,
      bike_number: true,
      bike_model: true,
      client: {
        select: {
          id: true,
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
              service: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.AssignmentSelect;

type ReportBooking = Prisma.BookingGetPayload<{
  select: typeof reportBookingSelect;
}>;
type EmployeeAssignment = Prisma.AssignmentGetPayload<{
  select: typeof employeeAssignmentSelect;
}>;

function summarizeBookings(bookings: ReportBooking[]) {
  const reviewedBookings = bookings.filter(
    (booking) =>
      booking.status === BookingStatus.completed && booking.review !== null,
  );
  const ratingTotal = reviewedBookings.reduce(
    (total, booking) => total + booking.review!.rating,
    0,
  );

  return {
    bookings_by_status: countStatuses(
      bookings.map((booking) => booking.status),
    ),
    bookings_by_service: countBookingsByService(bookings),
    reviews_count: reviewedBookings.length,
    average_rating: reviewedBookings.length
      ? normalizeAverage(ratingTotal / reviewedBookings.length)
      : null,
  };
}

function countStatuses(statuses: BookingStatus[]) {
  const counts: Record<BookingStatus, number> = {
    pending: 0,
    confirmed: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
  };

  for (const status of statuses) {
    counts[status] += 1;
  }

  return counts;
}

function countBookingsByService(bookings: ReportBooking[]) {
  const counts = new Map<
    string,
    { service_id: string; service_name: string; count: number }
  >();

  for (const booking of bookings) {
    const service = booking.daySlot.slot.service;
    const existing = counts.get(service.id);

    if (existing) {
      existing.count += 1;
    } else {
      counts.set(service.id, {
        service_id: service.id,
        service_name: service.name,
        count: 1,
      });
    }
  }

  return [...counts.values()].sort((a, b) =>
    a.service_name.localeCompare(b.service_name),
  );
}

function countBookingsByDay(
  bookings: ReportBooking[],
  start: Date,
  numberOfDays: number,
) {
  const counts = new Map<string, number>();

  for (const booking of bookings) {
    const date = dateKey(booking.daySlot.date);
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }

  return Array.from({ length: numberOfDays }, (_, index) => {
    const date = dateKey(addDays(start, index));

    return {
      date,
      count: counts.get(date) ?? 0,
    };
  });
}

function transformAssignment(assignment: EmployeeAssignment) {
  return {
    assignment_id: assignment.id,
    vehicle_ref: assignment.vehicle_ref,
    scheduled_time: assignment.scheduled_time
      ? formatTime(assignment.scheduled_time)
      : null,
    assigned_at: assignment.assigned_at,
    booking_id: assignment.booking.id,
    booking_status: assignment.booking.status,
    bike_number: assignment.booking.bike_number,
    bike_model: assignment.booking.bike_model,
    client: assignment.booking.client,
    service: assignment.booking.daySlot.slot.service,
    slot_label: assignment.booking.daySlot.slot.label,
    date: dateKey(assignment.booking.daySlot.date),
  };
}

function parseDate(value: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new BadRequestException('date must use YYYY-MM-DD format');
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || dateKey(date) !== value) {
    throw new BadRequestException('date must be a valid calendar date');
  }

  return date;
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * millisecondsPerDay);
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function localTodayKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatTime(time: Date) {
  return time.toISOString().slice(11, 16);
}

function normalizeAverage(value: number | null) {
  return value === null ? null : Number(value.toFixed(2));
}

const millisecondsPerDay = 24 * 60 * 60 * 1000;
