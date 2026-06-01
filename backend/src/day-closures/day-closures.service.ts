import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDayClosureDto } from './dto/create-day-closure.dto';

@Injectable()
export class DayClosuresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(closedBy: string, createDayClosureDto: CreateDayClosureDto) {
    const date = parseDate(createDayClosureDto.date);

    try {
      const closure = await this.prisma.dayClosure.create({
        data: {
          date,
          closed_by: closedBy,
          reason: createDayClosureDto.reason,
        },
      });

      await this.auditService.log({
        userId: closedBy,
        action: 'DAY_CLOSURE_CREATED',
        entity: 'day_closure',
        entityId: closure.id,
        metadata: {
          date: dateKey(closure.date),
          reason: closure.reason,
        },
      });

      return closure;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('This date is already closed');
      }

      throw error;
    }
  }

  async findAll(dateValue?: string) {
    if (dateValue) {
      return this.prisma.dayClosure.findUnique({
        where: {
          date: parseDate(dateValue),
        },
      });
    }

    return this.prisma.dayClosure.findMany({
      orderBy: {
        date: 'desc',
      },
    });
  }

  async remove(currentUserId: string, dateValue: string) {
    const date = parseDate(dateValue);
    const closure = await this.prisma.dayClosure.findUnique({
      where: {
        date,
      },
      select: {
        id: true,
      },
    });

    if (!closure) {
      throw new NotFoundException('Day closure not found');
    }

    const deletedClosure = await this.prisma.dayClosure.delete({
      where: {
        date,
      },
    });

    await this.auditService.log({
      userId: currentUserId,
      action: 'DAY_CLOSURE_DELETED',
      entity: 'day_closure',
      entityId: deletedClosure.id,
      metadata: {
        date: dateKey(deletedClosure.date),
        reason: deletedClosure.reason,
      },
    });

    return {
      message: 'Day closure deleted successfully',
    };
  }
}

function parseDate(value: string) {
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

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}
