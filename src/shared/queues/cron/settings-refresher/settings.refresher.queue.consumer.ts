import { Process, Processor, OnQueueCompleted } from '@nestjs/bull';
import { EQueueCronName } from '../../queue.enum';
import { Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { BannedIpGuard } from '../../../guards/banned.ip.guard';

@Processor(EQueueCronName.SettingsRefresher)
export class SettingsRefresherQueueConsumer {
  constructor(
    @InjectConnection() private db: Connection,
  ) {}

  @Process()
  async process() {
    BannedIpGuard.refreshBannedIps();
  }

  @OnQueueCompleted()
  onPollCleaningComplete() {
    Logger.log(`Settings refresh completed.`);
  }
}
