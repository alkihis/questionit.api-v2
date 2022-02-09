import { Controller, Delete, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../../shared/guards/jwt.auth.guard';
import { Right, RightsGuard } from '../../shared/guards/rights.guard';
import { EApplicationRight } from '../../database/enums/questionit.application.enum';
import { Request } from 'express';
import { getValidationPipe } from '../../shared/pipes/validation.pipe.utils';
import { ListNotificationDto } from './notification.dto';
import { RateLimit, RateLimitGuard } from '../../shared/guards/rate.limit.guard';
import { Timing } from '../../shared/utils/time.utils';

@Controller()
export class NotificationController {
  constructor(
    private notificationService: NotificationService,
  ) {}

  @Get('notification')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.ReadNotification)
  @RateLimit(60, Timing.minutes(1))
  async listNotifications(@Req() req: Request, @Query(getValidationPipe()) query: ListNotificationDto) {
    return await this.notificationService.listNotifications(req.user, query);
  }

  @Post('notification/bulk-all-as-seen')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.ReadNotification)
  @RateLimit(15, Timing.minutes(1))
  async markNotificationAsSeen(@Req() req: Request) {
    await this.notificationService.markAllNotificationsAsSeen(req.user);
    return await this.notificationService.getNotificationCounts(req.user);
  }

  @Get('notification/counts')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.ReadNotification)
  @RateLimit(900, Timing.minutes(15))
  async getNotificationCounts(@Req() req: Request) {
    return await this.notificationService.getNotificationCounts(req.user);
  }

  @Delete('notification/:id')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.DeleteNotification)
  @RateLimit(180, Timing.minutes(1))
  async deleteNotificationById(@Req() req: Request, @Param('id') id: string) {
    await this.notificationService.deleteNotificationById(req.user, id);

    return await this.notificationService.getNotificationCounts(req.user);
  }
}
