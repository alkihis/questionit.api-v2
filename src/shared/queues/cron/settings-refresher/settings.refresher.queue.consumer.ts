import { Process, Processor, OnQueueCompleted } from '@nestjs/bull';
import { EQueueCronName } from '../../queue.enum';
import { Logger } from '@nestjs/common';
import { InjectConnection, InjectDataSource } from '@nestjs/typeorm';
import { Connection, DataSource } from 'typeorm';
import { BannedIpGuard } from '../../../guards/banned.ip.guard';

@Processor(EQueueCronName.SettingsRefresher)
export class SettingsRefresherQueueConsumer {
  constructor(
    @InjectDataSource() private db: DataSource,
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
