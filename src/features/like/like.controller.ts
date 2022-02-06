import { Controller, Delete, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { LikeService } from './like.service';
import { JwtAuthGuard } from '../../shared/guards/jwt.auth.guard';
import { Right, RightsGuard } from '../../shared/guards/rights.guard';
import { RateLimit, RateLimitGuard } from '../../shared/guards/rate.limit.guard';
import { EApplicationRight } from '../../database/enums/questionit.application.enum';
import { Timing } from '../../shared/utils/time.utils';
import { Request } from 'express';

@Controller()
export class LikeController {
  constructor(
    private likeService: LikeService,
  ) {}

  @Post('like/:answerId')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.LikeQuestion)
  @RateLimit(15, Timing.minutes(1))
  async createLike(@Req() req: Request, @Param('answerId', ParseIntPipe) id: number) {
    return await this.likeService.createLike(req.user, id);
  }

  @Delete('like/:answerId')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.LikeQuestion)
  @RateLimit(15, Timing.minutes(1))
  async deleteLike(@Req() req: Request, @Param('answerId', ParseIntPipe) id: number) {
    return await this.likeService.deleteLike(req.user, id);
  }
}
