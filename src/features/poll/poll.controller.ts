import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PollService } from './poll.service';
import { JwtOrAnonymousAuthGuard } from '../../shared/guards/jwt.or.anonymous.auth.guard';
import { Right, RightsGuard } from '../../shared/guards/rights.guard';
import { EApplicationRight } from '../../database/enums/questionit.application.enum';
import { getValidationPipe } from '../../shared/pipes/validation.pipe.utils';
import { MakePollDto } from './poll.dto';
import { RateLimit, RateLimitGuard } from '../../shared/guards/rate.limit.guard';
import { Timing } from '../../shared/utils/time.utils';

@Controller()
export class PollController {
  constructor(
    private pollService: PollService,
  ) {}

  @Post('poll')
  @UseGuards(JwtOrAnonymousAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.SendQuestion)
  @RateLimit(5, Timing.minutes(1))
  async makePoll(@Body(getValidationPipe()) body: MakePollDto) {
    return await this.pollService.makePoll(body);
  }
}
