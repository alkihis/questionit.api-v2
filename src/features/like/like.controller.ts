import { Controller, Delete, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { LikeService } from './like.service';
import { JwtAuthGuard } from '../../shared/guards/jwt.auth.guard';
import { Right, RightsGuard } from '../../shared/guards/rights.guard';
import { RateLimit, RateLimitGuard } from '../../shared/guards/rate.limit.guard';
import { EApplicationRight } from '../../database/enums/questionit.application.enum';
import { Timing } from '../../shared/utils/time.utils';

@Controller()
export class LikeController {
  constructor(
    private likeService: LikeService,
  ) {}

  @Post('like/:answerId')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.LikeQuestion)
  @RateLimit(15, Timing.minutes(1))
  async createLike(@Param('answerId', ParseIntPipe) id: number) {
    return await this.likeService.createLike(id);
  }

  @Delete('like/:answerId')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.LikeQuestion)
  @RateLimit(15, Timing.minutes(1))
  async deleteLike(@Param('answerId', ParseIntPipe) id: number) {
    return await this.likeService.deleteLike(id);
  }
}
