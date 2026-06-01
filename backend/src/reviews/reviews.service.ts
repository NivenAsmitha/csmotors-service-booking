import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(clientId: string, createReviewDto: CreateReviewDto) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        id: createReviewDto.booking_id,
        client_id: clientId,
      },
      select: {
        id: true,
        status: true,
        assignment: {
          select: {
            employee_id: true,
          },
        },
        review: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== BookingStatus.completed) {
      throw new ConflictException('Only completed bookings can be reviewed');
    }

    if (!booking.assignment) {
      throw new ConflictException('Booking has no employee assignment');
    }

    if (booking.review) {
      throw new ConflictException('This booking already has a review');
    }

    try {
      const review = await this.prisma.review.create({
        data: {
          booking_id: booking.id,
          client_id: clientId,
          employee_id: booking.assignment.employee_id,
          rating: createReviewDto.rating,
          comment: createReviewDto.comment,
        },
        select: reviewSelect,
      });
      const auditMetadata: Prisma.InputJsonObject = {
        booking_id: review.booking_id,
        employee_id: review.employee_id,
        rating: review.rating,
      };

      await this.auditService.log({
        userId: clientId,
        action: 'REVIEW_CREATED',
        entity: 'review',
        entityId: review.id,
        metadata: auditMetadata,
      });

      return transformReview(review);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('This booking already has a review');
      }

      throw error;
    }
  }

  async findAll() {
    const reviews = await this.prisma.review.findMany({
      select: reviewSelect,
      orderBy: {
        created_at: 'desc',
      },
    });

    return reviews.map(transformReview);
  }

  async findEmployeeReviews(employeeId: string, currentEmployeeId?: string) {
    if (currentEmployeeId && currentEmployeeId !== employeeId) {
      throw new ForbiddenException('Employees can only view their own reviews');
    }

    const reviews = await this.prisma.review.findMany({
      where: {
        employee_id: employeeId,
      },
      select: reviewSelect,
      orderBy: {
        created_at: 'desc',
      },
    });

    return reviews.map(transformReview);
  }
}

const basicUserSelect = {
  id: true,
  name: true,
  email: true,
} satisfies Prisma.UserSelect;

const reviewSelect = {
  id: true,
  booking_id: true,
  client_id: true,
  employee_id: true,
  rating: true,
  comment: true,
  created_at: true,
  updated_at: true,
  client: {
    select: basicUserSelect,
  },
  employee: {
    select: basicUserSelect,
  },
  booking: {
    select: {
      id: true,
      status: true,
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
    },
  },
} satisfies Prisma.ReviewSelect;

type ReviewResponseSource = Prisma.ReviewGetPayload<{
  select: typeof reviewSelect;
}>;

function transformReview(review: ReviewResponseSource) {
  return {
    ...review,
    booking: {
      ...review.booking,
      date: review.booking.daySlot.date.toISOString().slice(0, 10),
      service: review.booking.daySlot.slot.service,
    },
  };
}
