import { Module } from '@nestjs/common';
import { BullModule, InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EQueueCronName } from '../../queue.enum';
import { HealthCheckQueueConsumer } from './health.check.queue.consumer';
import { cronQueueCleanOldJobs } from '../../../utils/queue.utils';

@Module({
  imports: [
    BullModule.registerQueue({
      name: EQueueCronName.HealthCheck,
      defaultJobOptions: {
        jobId: EQueueCronName.HealthCheck,
        removeOnComplete: true,
        removeOnFail: false,
        repeat: {
          cron: '0 * * * *',
        },
      },
    }),
  ],
  providers: [HealthCheckQueueConsumer],
})
export class HealthCheckQueueModule {
  constructor(@InjectQueue(EQueueCronName.HealthCheck) private readonly healthCheckQueue: Queue) {
    // clean every old jobs
    cronQueueCleanOldJobs(this.healthCheckQueue)
      .finally(() => {
        // add new job, in this configuration jobs, with same jobId and cron config, will not be added
        return this.healthCheckQueue.add(null);
      });
  }
}
