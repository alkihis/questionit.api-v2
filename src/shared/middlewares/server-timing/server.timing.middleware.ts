import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import onHeaders from 'on-headers';
import config from '../../config/config';
import { ServerTiming } from './server.timing';

declare global {
  namespace Express {
    interface Response {
      timing: ServerTiming;
    }
  }
}

declare module 'express' {
  interface Response {
    timing: ServerTiming;
  }
}

@Injectable()
export class ServerTimingMiddleware implements NestMiddleware<Request, Response> {
  use(req: Request, res: Response, next: () => void) {
    if (!config.ENV_IS.DEV) {
      next();
      return;
    }

    res.timing = new ServerTiming();

    onHeaders(res, () => {
      if (res.timing.hasTimings()) {
        res.setHeader('Server-Timing', res.timing.asHeaderValue());
      }
    });

    next();
  }
}
