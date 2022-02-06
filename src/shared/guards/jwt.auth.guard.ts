import { HttpException, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ErrorService } from '../modules/errors/error.service';
import { EApiError } from '../modules/errors/error.enum';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Here is the function called when token is parsed: Should throw if auth fails
  handleRequest(err: any, user: any, info: any) {
    // You can throw an exception based on either "info" or "err" arguments
    if (err || !user) {
      if (err instanceof HttpException) {
        throw err;
      }
      if (err) {
        throw ErrorService.throw(EApiError.ServerError);
      }

      throw ErrorService.throw(EApiError.InvalidExpiredToken);
    }

    return user;
  }
}
