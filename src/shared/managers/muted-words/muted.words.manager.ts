import WorkerThreadManager from 'worker-thread-manager';
import { IMutedWordsWorkerEndMessage, IMutedWordsWorkerSendMessage } from './muted.words.interface';
import config from '../../config/config';

export class MutedWordsManager {
  protected static pool = WorkerThreadManager.spawn<IMutedWordsWorkerSendMessage, IMutedWordsWorkerEndMessage>(
    // Filename to worker JS file
    config.WORKERS.MUTED_WORDS,
    {
      // Maximum of 4 instances of worker.js (default: 1)
      poolLength: 2,
      // Before instanciate a new worker, wait for every
      // started worker to have 5 tasks currently running at least
      // (default: 0 (aggressive spawning if a worker is unused))
      spawnerThreshold: 5,
      workerData: config.DATA.BANNED_WORDS,
      // 8 minutes
      stopOnNoTask: 1000 * 60 * 8,
    }
  );

  static async match(content: string[], mutedWordsList: string[], options: { matchMuted: boolean, matchSafe: boolean }) {
    const msg: IMutedWordsWorkerSendMessage = {
      content,
      mutedWordsList,
      options,
    };

    const result = await this.pool.run(msg);

    if (result.error) {
      throw new Error('Unable to check muted status');
    }

    return result.muted;
  }

  static async syncWords() {
    this.pool.send({ refresh: config.DATA.BANNED_WORDS });
  }
};
