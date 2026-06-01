import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { AuditService } from './audit.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

@ApiTags('audit-logs')
@ApiBearerAuth()
@Roles(UserRole.developer)
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @ApiOperation({ summary: 'List paginated audit logs' })
  @Get()
  findAll(@Query() query: AuditLogQueryDto) {
    return this.auditService.findAll(query);
  }

  @ApiOperation({ summary: 'Get one audit log' })
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.auditService.findOne(id);
  }
}
