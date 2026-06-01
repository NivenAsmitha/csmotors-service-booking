import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Roles } from '../common/decorators/roles.decorator';
import { DailyReportQueryDto } from './dto/daily-report-query.dto';
import { MonthlyReportQueryDto } from './dto/monthly-report-query.dto';
import { WeeklyReportQueryDto } from './dto/weekly-report-query.dto';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@Roles(UserRole.admin, UserRole.developer)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({ summary: 'Get a daily booking report' })
  @Get('daily')
  getDaily(@Query() query: DailyReportQueryDto) {
    return this.reportsService.getDaily(query.date);
  }

  @ApiOperation({ summary: 'Get a seven-day booking report' })
  @Get('weekly')
  getWeekly(@Query() query: WeeklyReportQueryDto) {
    return this.reportsService.getWeekly(query.start);
  }

  @ApiOperation({ summary: 'Get a monthly booking report' })
  @Get('monthly')
  getMonthly(@Query() query: MonthlyReportQueryDto) {
    return this.reportsService.getMonthly(query.year, query.month);
  }

  @ApiOperation({ summary: 'Get an employee performance report' })
  @Get('employee/:id')
  getEmployee(@Param('id', ParseUUIDPipe) id: string) {
    return this.reportsService.getEmployee(id);
  }

  @ApiOperation({ summary: 'Get a dashboard summary' })
  @Get('summary')
  getSummary() {
    return this.reportsService.getSummary();
  }
}
