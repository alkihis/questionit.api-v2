import { Module } from '@nestjs/common';
import { HealthCheckQueueModule } from './health-check/health.check.queue.module';
import { MediaCleaningQueueModule } from './media-cleaning/media.cleaning.queue.module';
import { UnaffectedPollsQueueModule } from './unaffected-polls/unaffected.polls.queue.module';
import { TokenCleaningQueueModule } from './token-cleaning/token.cleaning.queue.module';

@Module({
  imports: [HealthCheckQueueModule, MediaCleaningQueueModule, UnaffectedPollsQueueModule, TokenCleaningQueueModule],
})
export class CronQueueModule {}
