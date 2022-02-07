import { Body, Controller, DefaultValuePipe, Delete, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { PushService } from './push.service';
import { JwtAuthGuard } from '../../shared/guards/jwt.auth.guard';
import { Right, RightsGuard } from '../../shared/guards/rights.guard';
import { EApplicationRight } from '../../database/enums/questionit.application.enum';
import { Request } from 'express';
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
  async updatePushRequest(@Req() req: Request, @Body(getValidationPipe()) body: UpdateSubscriptionDto) {
    return await this.pushService.updatePushRequest(req.user, body);
  }

  @Post('push')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.InternalUseOnly)
  @RateLimit(5, Timing.minutes(1))
  async createPushSubcription(@Req() req: Request, @Body(getValidationPipe()) body: CreateSubscriptionDto) {
    return await this.pushService.createPushSubscription(req.user, body);
  }

  @Delete('push')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.InternalUseOnly)
  @RateLimit(15, Timing.minutes(1))
  async deletePushSubscription(@Req() req: Request, @Query('endpoint', new DefaultValuePipe('')) endpoint: string) {
    return await this.pushService.deletePushSubscription(req.user, endpoint);
  }
}
