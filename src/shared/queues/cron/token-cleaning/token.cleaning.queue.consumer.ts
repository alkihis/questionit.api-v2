import { Process, Processor, OnQueueCompleted } from '@nestjs/bull';
import { EQueueCronName } from '../../queue.enum';
import { Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { DateTime } from 'luxon';
import { Token } from '../../../../database/entities/token.entity';

@Processor(EQueueCronName.TokenCleaning)
export class TokenCleaningQueueConsumer {
  constructor(
    @InjectConnection() private db: Connection,
  ) {}

  @Process()
  async process() {
    Logger.log(`Starting token cleaning.`);

    // Get unaffected polls
    const fifthteenMinutesFromNow = DateTime.now()
      .minus({ minutes: 15 })
      .toJSDate();

    await this.db.getRepository(Token)
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :fifthteenMinutesFromNow', { fifthteenMinutesFromNow })
      .execute();
  }

  @OnQueueCompleted()
  onPollCleaningComplete() {
    Logger.log(`Cleaning of expired token completed.`);
  }
}
