import { Module } from '@nestjs/common';
import { BullModule, InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EQueueCronName } from '../../queue.enum';
import { cronQueueCleanOldJobs } from '../../../utils/queue.utils';
import { TokenCleaningQueueConsumer } from './token.cleaning.queue.consumer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: EQueueCronName.TokenCleaning,
      defaultJobOptions: {
        jobId: EQueueCronName.TokenCleaning,
        removeOnComplete: true,
        removeOnFail: false,
        repeat: {
          cron: '0 * * * *',
        },
      },
    }),
  ],
  providers: [TokenCleaningQueueConsumer],
})
export class TokenCleaningQueueModule {
  constructor(@InjectQueue(EQueueCronName.TokenCleaning) private readonly queue: Queue) {
    // clean every old jobs
    cronQueueCleanOldJobs(this.queue)
      .finally(() => {
        // add new job, in this configuration jobs, with same jobId and cron config, will not be added
        return this.queue.add(null);
      });
  }
}
