import { Module } from '@nestjs/common';
import { CronQueueModule } from './cron/cron.queue.module';
import config from '../config/config';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: config.REDIS.HOST,
        password: config.REDIS.PASSWORD,
        port: config.REDIS.PORT,
        db: 1,
      },
    }),
    CronQueueModule,
  ],
  providers: [],
})
export class QueueModule {}
