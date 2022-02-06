import { Module } from '@nestjs/common';
import { HealthCheckQueueModule } from './health-check/health.check.queue.module';
import { MediaCleaningQueueModule } from './media-cleaning/media.cleaning.queue.module';

@Module({
  imports: [HealthCheckQueueModule, MediaCleaningQueueModule],
})
export class CronQueueModule {}
