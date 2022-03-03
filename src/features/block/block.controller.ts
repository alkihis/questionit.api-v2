import { Controller, Delete, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { BlockService } from './block.service';
import { RateLimit, RateLimitGuard } from '../../shared/guards/rate.limit.guard';
import { Timing } from '../../shared/utils/time.utils';
import { JwtAuthGuard } from '../../shared/guards/jwt.auth.guard';
import { Right, RightsGuard } from '../../shared/guards/rights.guard';
import { EApplicationRight } from '../../database/enums/questionit.application.enum';

@Controller()
export class BlockController {
  constructor(
    private blockService: BlockService,
  ) {}

  @Post('user/block/:id')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.BlockUser)
  @RateLimit(10, Timing.minutes(1))
  async blockUser(@Param('id', ParseIntPipe) userId: number) {
    return await this.blockService.blockUser(userId);
  }

  @Delete('user/block/:id')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.BlockUser)
  @RateLimit(10, Timing.minutes(1))
  async unblockUser(@Param('id', ParseIntPipe) userId: number) {
    return await this.blockService.unblockUser(userId);
  }
}
