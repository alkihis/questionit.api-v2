import { Request, Response } from 'express';
import { AsyncLocalStorage } from 'async_hooks';

class ContinuationLocalStorage<T> extends AsyncLocalStorage<T> {
  public getContext(): T | undefined {
    return this.getStore();
  }

  public setContext(value: T): T {
    this.enterWith(value);
    return value;
  }
}

export class RequestContext {
  static cls = new ContinuationLocalStorage<RequestContext>();

  static get currentContext() {
    return this.cls.getContext();
  }

  readonly requestTime: number;

  constructor(
    public readonly req: Request,
    public readonly res: Response,
  ) {
    this.requestTime = Date.now();
  }
}
