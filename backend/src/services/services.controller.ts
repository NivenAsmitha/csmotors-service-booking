import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesService } from './services.service';

@ApiTags('services')
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Public()
  @ApiOperation({ summary: 'List active services' })
  @Get()
  findActive() {
    return this.servicesService.findActive();
  }

  @ApiBearerAuth()
  @Roles(UserRole.developer, UserRole.admin)
  @ApiOperation({ summary: 'List all services, including inactive services' })
  @Get('admin/all')
  findAll() {
    return this.servicesService.findAll();
  }

  @ApiBearerAuth()
  @Roles(UserRole.admin)
  @ApiOperation({ summary: 'Update a service' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateServiceDto: UpdateServiceDto) {
    return this.servicesService.update(id, updateServiceDto);
  }
}
