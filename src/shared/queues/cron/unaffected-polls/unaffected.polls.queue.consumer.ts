import { Process, Processor, OnQueueCompleted } from '@nestjs/bull';
import { EQueueCronName } from '../../queue.enum';
import { Logger } from '@nestjs/common';
import { InjectConnection, InjectDataSource } from '@nestjs/typeorm';
import { Connection, DataSource } from 'typeorm';
import { Poll } from '../../../../database/entities/poll.entity';
import { DateTime } from 'luxon';

@Processor(EQueueCronName.UnaffectedPolls)
export class UnaffectedPollsQueueConsumer {
  constructor(
    @InjectDataSource() private db: DataSource,
  ) {}

  @Process()
  async process() {
    Logger.log(`Starting poll cleaning.`);

    // Get unaffected polls
    const fifthteenMinutesFromNow = DateTime.now()
      .minus({ minutes: 15 })
      .toJSDate();

    await this.db.getRepository(Poll)
      .createQueryBuilder()
      .delete()
      .where('questionId IS NULL')
      .andWhere('createdAt < :fifthteenMinutesFromNow', { fifthteenMinutesFromNow })
      .execute();
  }

  @OnQueueCompleted()
  onPollCleaningComplete() {
    Logger.log(`Cleaning of unaffected polls completed.`);
  }
}
