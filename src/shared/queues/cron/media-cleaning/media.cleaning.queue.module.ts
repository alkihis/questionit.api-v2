import { Module } from '@nestjs/common';
import { BullModule, InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EQueueCronName } from '../../queue.enum';
import { cronQueueCleanOldJobs } from '../../../utils/queue.utils';
import { MediaCleaningQueueConsumer } from './media.cleaning.queue.consumer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: EQueueCronName.MediasCleaning,
      defaultJobOptions: {
        jobId: EQueueCronName.MediasCleaning,
        removeOnComplete: true,
        removeOnFail: false,
        repeat: {
          cron: '0 * * * *',
        },
      },
    }),
  ],
  providers: [MediaCleaningQueueConsumer],
})
export class MediaCleaningQueueModule {
  constructor(@InjectQueue(EQueueCronName.MediasCleaning) private readonly healthCheckQueue: Queue) {
    // clean every old jobs
    cronQueueCleanOldJobs(this.healthCheckQueue)
      .finally(() => {
        // add new job, in this configuration jobs, with same jobId and cron config, will not be added
        return this.healthCheckQueue.add(null);
      });
  }
}
