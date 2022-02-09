import { HttpException, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IErrorContent } from '../modules/errors/error.service';
import { EApiError } from '../modules/errors/error.enum';
import { RequestUserManager } from '../managers/request.user.manager';

@Injectable()
export class JwtOrAnonymousAuthGuard extends AuthGuard('jwt') {
  // Here is the function called when token is parsed: Should throw if auth fails
  handleRequest(err: any, user: any, info: any) {
    // You can throw an exception based on either "info" or "err" arguments
    // Do not throw if token is invalid or user is not logged
    if (err && err instanceof HttpException) {
      const content = err.getResponse() as IErrorContent;

      if (content.code === EApiError.BannedUser) {
        throw err;
      }

      return null;
    } else if (user instanceof RequestUserManager) {
      return user as any;
    }

    return null;
  }
}
