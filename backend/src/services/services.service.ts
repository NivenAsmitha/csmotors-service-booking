import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  findActive() {
    return this.prisma.service.findMany({
      where: {
        is_active: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  findAll() {
    return this.prisma.service.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async update(
    currentUserId: string,
    id: string,
    updateServiceDto: UpdateServiceDto,
  ) {
    const previousService = await this.assertExists(id);

    try {
      const service = await this.prisma.service.update({
        where: {
          id,
        },
        data: updateServiceDto,
      });

      if (
        updateServiceDto.description !== undefined ||
        updateServiceDto.details !== undefined
      ) {
        await this.auditService.log({
          userId: currentUserId,
          action: 'SERVICE_DETAILS_UPDATED',
          entity: 'service',
          entityId: service.id,
          metadata: {
            old: {
              description: previousService.description,
              details: previousService.details,
            },
            new: {
              description: service.description,
              details: service.details,
            },
          },
        });
      }

      return service;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('A service with this name already exists');
      }

      throw error;
    }
  }

  private async assertExists(id: string) {
    const service = await this.prisma.service.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        description: true,
        details: true,
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }
}
