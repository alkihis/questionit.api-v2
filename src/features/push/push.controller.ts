import { Body, Controller, DefaultValuePipe, Delete, Get, Post, Query, UseGuards } from '@nestjs/common';
import { PushService } from './push.service';
import { JwtAuthGuard } from '../../shared/guards/jwt.auth.guard';
import { Right, RightsGuard } from '../../shared/guards/rights.guard';
import { EApplicationRight } from '../../database/enums/questionit.application.enum';
import { getValidationPipe } from '../../shared/pipes/validation.pipe.utils';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './push.dto';
import { RateLimit, RateLimitGuard } from '../../shared/guards/rate.limit.guard';
import { Timing } from '../../shared/utils/time.utils';

@Controller()
export class PushController {
  constructor(
    private pushService: PushService,
  ) {}

  @Get('push/key')
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @RateLimit(900, Timing.minutes(15))
  getServerKey() {
    return this.pushService.getServerKey();
  }

  @Post('push/update')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.InternalUseOnly)
  @RateLimit(15, Timing.minutes(1))
  async updatePushRequest(@Body(getValidationPipe()) body: UpdateSubscriptionDto) {
    return await this.pushService.updatePushRequest(body);
  }

  @Post('push')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.InternalUseOnly)
  @RateLimit(5, Timing.minutes(1))
  async createPushSubcription(@Body(getValidationPipe()) body: CreateSubscriptionDto) {
    return await this.pushService.createPushSubscription(body);
  }

  @Delete('push')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.InternalUseOnly)
  @RateLimit(15, Timing.minutes(1))
  async deletePushSubscription(@Query('endpoint', new DefaultValuePipe('')) endpoint: string) {
    return await this.pushService.deletePushSubscription(endpoint);
  }
}
