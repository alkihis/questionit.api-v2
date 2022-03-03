import { Module } from '@nestjs/common';
import { BullModule, InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EQueueCronName } from '../../queue.enum';
import { cronQueueCleanOldJobs } from '../../../utils/queue.utils';
import { SettingsRefresherQueueConsumer } from './settings.refresher.queue.consumer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: EQueueCronName.SettingsRefresher,
      defaultJobOptions: {
        jobId: EQueueCronName.SettingsRefresher,
        removeOnComplete: true,
        removeOnFail: false,
        repeat: {
          cron: '*/30 * * * *',
        },
      },
    }),
  ],
  providers: [SettingsRefresherQueueConsumer],
})
export class SettingsRefresherQueueModule {
  constructor(@InjectQueue(EQueueCronName.SettingsRefresher) private readonly queue: Queue) {
    // clean every old jobs
    cronQueueCleanOldJobs(this.queue)
      .finally(() => {
        // add new job, in this configuration jobs, with same jobId and cron config, will not be added
        return this.queue.add(null);
      });
  }
}
