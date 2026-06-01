import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

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

  async update(id: string, updateServiceDto: UpdateServiceDto) {
    await this.assertExists(id);

    try {
      return await this.prisma.service.update({
        where: {
          id,
        },
        data: updateServiceDto,
      });
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
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }
  }
}
