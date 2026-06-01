import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { type AuthenticatedUser } from '../auth/auth.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@ApiBearerAuth()
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Roles(UserRole.client)
  @ApiOperation({ summary: 'Create a review for a completed client booking' })
  @Post()
  create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewsService.create(currentUser.id, createReviewDto);
  }

  @Roles(UserRole.admin, UserRole.developer)
  @ApiOperation({ summary: 'List all reviews' })
  @Get()
  findAll() {
    return this.reviewsService.findAll();
  }

  @Roles(UserRole.employee)
  @ApiOperation({ summary: 'List reviews for the current employee' })
  @Get('my')
  findMy(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.reviewsService.findEmployeeReviews(currentUser.id);
  }

  @Roles(UserRole.admin, UserRole.developer, UserRole.employee)
  @ApiOperation({ summary: 'List reviews for an employee' })
  @Get('employee/:id')
  findEmployeeReviews(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) employeeId: string,
  ) {
    return this.reviewsService.findEmployeeReviews(
      employeeId,
      currentUser.role === UserRole.employee ? currentUser.id : undefined,
    );
  }
}
