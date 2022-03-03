import { Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../../shared/guards/jwt.auth.guard';
import { Right, RightsGuard } from '../../shared/guards/rights.guard';
import { EApplicationRight } from '../../database/enums/questionit.application.enum';
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
  async listNotifications(@Query(getValidationPipe()) query: ListNotificationDto) {
    return await this.notificationService.listNotifications(query);
  }

  @Post('notification/bulk-all-as-seen')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.ReadNotification)
  @RateLimit(15, Timing.minutes(1))
  async markNotificationAsSeen() {
    await this.notificationService.markAllNotificationsAsSeen();
    return await this.notificationService.getNotificationCounts();
  }

  @Get('notification/counts')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.ReadNotification)
  @RateLimit(900, Timing.minutes(15))
  async getNotificationCounts() {
    return await this.notificationService.getNotificationCounts();
  }

  @Delete('notification/:id')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.DeleteNotification)
  @RateLimit(180, Timing.minutes(1))
  async deleteNotificationById(@Param('id') id: string) {
    await this.notificationService.deleteNotificationById(id);

    return await this.notificationService.getNotificationCounts();
  }
}
