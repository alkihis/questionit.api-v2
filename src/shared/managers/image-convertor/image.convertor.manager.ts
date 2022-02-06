import WorkerThreadManager from 'worker-thread-manager';
import { IImageConvertorWorkerEndMessage, IImageConvertorWorkerSendMessage, TImageDimensions } from './image.convertor.interface';
import config from '../../config/config';

export class ImageConvertorManager {
  protected static pool = WorkerThreadManager.spawn<IImageConvertorWorkerSendMessage, IImageConvertorWorkerEndMessage>(
    // Filename to worker JS file
    config.WORKERS.IMAGE_CONVERTOR,
    {
      // Maximum of 4 instances of worker.js (default: 1)
      poolLength: 4,
      // Before instanciate a new worker, wait for every
      // started worker to have 5 tasks currently running at least
      // (default: 0 (aggressive spawning if a worker is unused))
      spawnerThreshold: 5,
      // 8 minutes
      stopOnNoTask: 1000 * 60 * 8,
    },
  );

  static async convert(path: string, dimensions: TImageDimensions | undefined, mime: string) {
    const msg: IImageConvertorWorkerSendMessage = {
      mime,
      dimensions,
      path
    };

    return this.pool.run(msg);
  }
}
