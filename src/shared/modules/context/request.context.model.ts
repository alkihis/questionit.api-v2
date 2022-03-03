import { Request, Response } from 'express';
import { AsyncLocalStorage } from 'async_hooks';

export class RequestContext {
  static cls = new AsyncLocalStorage<RequestContext>();

  static get currentContext() {
    return this.cls.getStore();
  }

  readonly requestTime: number;

  constructor(
    public readonly req: Request,
    public readonly res: Response,
  ) {
    this.requestTime = Date.now();
  }
}
