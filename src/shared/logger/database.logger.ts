import { Logger, QueryRunner, SimpleConsoleLogger } from 'typeorm';
import { RequestContext } from '../modules/context/request.context.model';

export class DatabaseLogger extends SimpleConsoleLogger implements Logger {
  /**
   * Logs query that is slow.
   */
  override logQuerySlow(time: number, query: string, parameters?: any[], queryRunner?: QueryRunner) {
    const context = RequestContext.currentContext;

    if (context && context.res?.timing) {
      context.res.timing.addTiming('SQL', time);
    }
  }
}
