import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { DisplayService } from './display.service';

@ApiTags('display')
@Controller('display')
export class DisplayController {
  constructor(private readonly displayService: DisplayService) {}

  @Public()
  @ApiOperation({ summary: "Get today's assigned services display data" })
  @ApiQuery({ name: 'date', example: '2026-06-04', required: false })
  @Get('today-services')
  getTodayServices(@Query('date') date?: string) {
    return this.displayService.getTodayServices(date);
  }
}
