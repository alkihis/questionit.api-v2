import { Module } from '@nestjs/common';
import { BullModule, InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EQueueCronName } from '../../queue.enum';
import { cronQueueCleanOldJobs } from '../../../utils/queue.utils';
import { UnaffectedPollsQueueConsumer } from './unaffected.polls.queue.consumer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: EQueueCronName.UnaffectedPolls,
      defaultJobOptions: {
        jobId: EQueueCronName.UnaffectedPolls,
        removeOnComplete: true,
        removeOnFail: false,
        repeat: {
          cron: '*/15 * * * *',
        },
      },
    }),
  ],
  providers: [UnaffectedPollsQueueConsumer],
})
export class UnaffectedPollsQueueModule {
  constructor(@InjectQueue(EQueueCronName.UnaffectedPolls) private readonly queue: Queue) {
    // clean every old jobs
    cronQueueCleanOldJobs(this.queue)
      .finally(() => {
        // add new job, in this configuration jobs, with same jobId and cron config, will not be added
        return this.queue.add(null);
      });
  }
}
