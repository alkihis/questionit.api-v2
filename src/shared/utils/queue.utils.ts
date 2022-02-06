import { Queue } from 'bull';
import { Logger } from '@nestjs/common';

export const cronQueueCleanOldJobs = async (queue: Queue) => {
  const jobList = await queue.getRepeatableJobs();
  // Delete all old jobs
  await Promise.all(jobList.map(job => queue.removeRepeatableByKey(job.key)));

  for (const job of jobList) {
    Logger.warn(`job ${job.key} removed: ${JSON.stringify(job)}`);
  }
};
