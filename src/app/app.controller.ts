import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { RateLimit, RateLimitGuard } from '../shared/guards/rate.limit.guard';
import { JwtAuthGuard } from '../shared/guards/jwt.auth.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @RateLimit(120)
  getHello(): string {
    return this.appService.getHello();
  }
}
