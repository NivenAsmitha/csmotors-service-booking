import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma, UserRole } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';

@Injectable()
export class AssignmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(assignedBy: string, createAssignmentDto: CreateAssignmentDto) {
    const booking = await this.prisma.booking.findUnique({
      where: {
        id: createAssignmentDto.booking_id,
      },
      select: {
        id: true,
        status: true,
        assignment: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status === BookingStatus.cancelled) {
      throw new ConflictException('Cancelled bookings cannot be assigned');
    }

    if (booking.assignment) {
      throw new ConflictException('This booking already has an assignment');
    }

    await this.assertActiveEmployee(createAssignmentDto.employee_id);

    try {
      const assignment = await this.prisma.assignment.create({
        data: {
          booking_id: createAssignmentDto.booking_id,
          employee_id: createAssignmentDto.employee_id,
          vehicle_ref: createAssignmentDto.vehicle_ref,
          scheduled_time: createAssignmentDto.scheduled_time
            ? parseTime(createAssignmentDto.scheduled_time)
            : undefined,
          assigned_by: assignedBy,
        },
        select: assignmentSelect,
      });

      await this.auditService.log({
        userId: assignedBy,
        action: 'ASSIGNMENT_CREATED',
        entity: 'assignment',
        entityId: assignment.id,
        metadata: {
          booking_id: assignment.booking_id,
          employee_id: assignment.employee_id,
          vehicle_ref: assignment.vehicle_ref,
          scheduled_time: formatOptionalTime(assignment.scheduled_time),
        },
      });

      return transformAssignment(assignment);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('This booking already has an assignment');
      }

      throw error;
    }
  }

  async update(
    currentUserId: string,
    id: string,
    updateAssignmentDto: UpdateAssignmentDto,
  ) {
    const previousAssignment = await this.assertAssignmentExists(id);

    if (updateAssignmentDto.employee_id) {
      await this.assertActiveEmployee(updateAssignmentDto.employee_id);
    }

    const assignment = await this.prisma.assignment.update({
      where: {
        id,
      },
      data: {
        employee_id: updateAssignmentDto.employee_id,
        vehicle_ref: updateAssignmentDto.vehicle_ref,
        scheduled_time: updateAssignmentDto.scheduled_time
          ? parseTime(updateAssignmentDto.scheduled_time)
          : undefined,
      },
      select: assignmentSelect,
    });

    await this.auditService.log({
      userId: currentUserId,
      action: 'ASSIGNMENT_UPDATED',
      entity: 'assignment',
      entityId: assignment.id,
      metadata: {
        old: {
          employee_id: previousAssignment.employee_id,
          vehicle_ref: previousAssignment.vehicle_ref,
          scheduled_time: formatOptionalTime(previousAssignment.scheduled_time),
        },
        new: {
          employee_id: assignment.employee_id,
          vehicle_ref: assignment.vehicle_ref,
          scheduled_time: formatOptionalTime(assignment.scheduled_time),
        },
      },
    });

    return transformAssignment(assignment);
  }

  async findBoard(dateValue: string) {
    const date = parseDate(dateValue);
    const bookings = await this.prisma.booking.findMany({
      where: {
        daySlot: {
          date,
        },
      },
      select: boardBookingSelect,
      orderBy: {
        created_at: 'asc',
      },
    });

    return bookings.map(transformBoardBooking);
  }

  async findMy(employeeId: string, dateValue?: string) {
    const assignments = await this.prisma.assignment.findMany({
      where: {
        employee_id: employeeId,
        ...(dateValue
          ? {
              booking: {
                daySlot: {
                  date: parseDate(dateValue),
                },
              },
            }
          : {}),
      },
      select: assignmentSelect,
      orderBy: {
        assigned_at: 'desc',
      },
    });

    return assignments.map(transformAssignment);
  }

  private async assertActiveEmployee(id: string) {
    const employee = await this.prisma.user.findFirst({
      where: {
        id,
        role: UserRole.employee,
        is_active: true,
      },
      select: {
        id: true,
      },
    });

    if (!employee) {
      throw new BadRequestException('Active employee not found');
    }
  }

  private async assertAssignmentExists(id: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        employee_id: true,
        vehicle_ref: true,
        scheduled_time: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    return assignment;
  }
}

const basicUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
} satisfies Prisma.UserSelect;

const assignmentSelect = {
  id: true,
  booking_id: true,
  employee_id: true,
  vehicle_ref: true,
  assigned_by: true,
  assigned_at: true,
  scheduled_time: true,
  created_at: true,
  updated_at: true,
  employee: {
    select: basicUserSelect,
  },
  booking: {
    select: {
      id: true,
      status: true,
      notes: true,
      bike_number: true,
      bike_model: true,
      client: {
        select: basicUserSelect,
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

const boardBookingSelect = {
  id: true,
  status: true,
  bike_number: true,
  bike_model: true,
  client: {
    select: basicUserSelect,
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
  assignment: {
    select: {
      id: true,
      employee_id: true,
      vehicle_ref: true,
      scheduled_time: true,
      employee: {
        select: {
          name: true,
        },
      },
    },
  },
} satisfies Prisma.BookingSelect;

type AssignmentResponseSource = Prisma.AssignmentGetPayload<{
  select: typeof assignmentSelect;
}>;
type BoardBookingSource = Prisma.BookingGetPayload<{
  select: typeof boardBookingSelect;
}>;

function transformAssignment(assignment: AssignmentResponseSource) {
  const { slot } = assignment.booking.daySlot;

  return {
    ...assignment,
    scheduled_time: formatOptionalTime(assignment.scheduled_time),
    booking: {
      ...assignment.booking,
      daySlot: {
        ...assignment.booking.daySlot,
        date: dateKey(assignment.booking.daySlot.date),
        slot: {
          ...slot,
          start_time: formatTime(slot.start_time),
          end_time: formatTime(slot.end_time),
        },
      },
    },
  };
}

function transformBoardBooking(booking: BoardBookingSource) {
  const { slot } = booking.daySlot;

  return {
    booking_id: booking.id,
    status: booking.status,
    bike_number: booking.bike_number,
    bike_model: booking.bike_model,
    client: booking.client,
    service_name: slot.service.name,
    slot_label: slot.label,
    start_time: formatTime(slot.start_time),
    end_time: formatTime(slot.end_time),
    date: dateKey(booking.daySlot.date),
    assignment: booking.assignment
      ? {
          id: booking.assignment.id,
          employee_id: booking.assignment.employee_id,
          employee_name: booking.assignment.employee.name,
          vehicle_ref: booking.assignment.vehicle_ref,
          scheduled_time: formatOptionalTime(booking.assignment.scheduled_time),
        }
      : null,
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

function parseTime(value: string) {
  return new Date(`1970-01-01T${value}:00.000Z`);
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatOptionalTime(time: Date | null) {
  return time ? formatTime(time) : null;
}

function formatTime(time: Date) {
  return time.toISOString().slice(11, 16);
}
