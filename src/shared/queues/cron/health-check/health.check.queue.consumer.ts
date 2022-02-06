import { Process, Processor, OnQueueCompleted } from '@nestjs/bull';
import { EQueueCronName } from '../../queue.enum';
import { Logger } from '@nestjs/common';

@Processor(EQueueCronName.HealthCheck)
export class HealthCheckQueueConsumer {
  @Process()
  process(payload: any) {
    Logger.log(`Queue Application still alive !`);
  }

  @OnQueueCompleted()
  completed(payload: any) {
    Logger.log(`Queue job ${EQueueCronName.HealthCheck} completed`);
  }
}
