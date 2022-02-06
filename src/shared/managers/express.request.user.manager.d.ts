import type { RequestUserManager } from './request.user.manager';

declare global {
  namespace Express {
    interface Request {
      user?: RequestUserManager;
    }
  }
}

declare module 'express' {
  interface Request {
    user?: RequestUserManager;
  }
}
