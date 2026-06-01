import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

export type AuditLogParams = {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(params: AuditLogParams): Promise<void> {
    try {
      const sanitizedMetadata =
        params.metadata === undefined
          ? undefined
          : sanitizeMetadata(params.metadata);

      await this.prisma.auditLog.create({
        data: {
          user_id: params.userId ?? null,
          action: params.action,
          entity: params.entity,
          entity_id: params.entityId ?? null,
          ...(sanitizedMetadata !== undefined
            ? { metadata: sanitizedMetadata }
            : {}),
        },
      });
    } catch (error: unknown) {
      this.logger.error('Audit logging failed', error);
    }
  }

  async findAll(query: AuditLogQueryDto) {
    const where: Prisma.AuditLogWhereInput = {
      entity: query.entity,
      action: query.action,
      user_id: query.user_id,
      ...(query.from || query.to
        ? {
            created_at: {
              ...(query.from ? { gte: parseDate(query.from) } : {}),
              ...(query.to ? { lt: addDays(parseDate(query.to), 1) } : {}),
            },
          }
        : {}),
    };
    const skip = (query.page - 1) * query.limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        select: auditLogSelect,
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: query.limit,
      }),
      this.prisma.auditLog.count({
        where,
      }),
    ]);

    return {
      data,
      total,
      page: query.page,
      limit: query.limit,
      total_pages: Math.ceil(total / query.limit),
    };
  }

  async findOne(id: string) {
    const auditLog = await this.prisma.auditLog.findUnique({
      where: {
        id,
      },
      select: auditLogSelect,
    });

    if (!auditLog) {
      throw new NotFoundException('Audit log not found');
    }

    return auditLog;
  }
}

const auditLogSelect = {
  id: true,
  user_id: true,
  action: true,
  entity: true,
  entity_id: true,
  metadata: true,
  created_at: true,
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
} satisfies Prisma.AuditLogSelect;

const sensitiveKeys = [
  'password',
  'password_hash',
  'token',
  'secret',
  'authorization',
];

function sanitizeMetadata(value: Prisma.InputJsonValue): Prisma.InputJsonValue {
  return sanitizeJsonValue(value) ?? {};
}

function sanitizeJsonValue(
  value: unknown,
): Prisma.InputJsonValue | null | undefined {
  if (value === null || value === undefined) {
    return value;
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((nestedValue) => sanitizeJsonValue(nestedValue) ?? null);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object') {
    const sanitizedObject: Record<string, Prisma.InputJsonValue | null> = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      if (!isSensitiveKey(key)) {
        const sanitizedValue = sanitizeJsonValue(nestedValue);

        if (sanitizedValue !== undefined) {
          sanitizedObject[key] = sanitizedValue;
        }
      }
    }

    return sanitizedObject;
  }

  return undefined;
}

function isSensitiveKey(key: string) {
  const normalizedKey = key.toLowerCase();

  return sensitiveKeys.some((sensitiveKey) =>
    normalizedKey.includes(sensitiveKey),
  );
}

function parseDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new BadRequestException('date must be a valid calendar date');
  }

  return date;
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
