import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { EApplicationRight } from '../../database/enums/questionit.application.enum';
import { RequestUserManager } from '../managers/request.user.manager';
import { ErrorService } from '../modules/errors/error.service';
import { EApiError } from '../modules/errors/error.enum';

const metaKey = '_tokenRights_';

export const Right = (...rights: EApplicationRight[]) => SetMetadata(metaKey, rights);

/**
 * Prevent using an endpoint with an application token.
 *
 * If you want to deny every request made with non-official token ("app token"), use `@Right(ApplicationRight.DenyAppToken)`.
 *
 * Example usage within an endpoint:
 * ```ts
 * \@UseGuards(JwtAuthGuard, RightsGuard) // Specify RightsGuard **after** the JWT check (it needs it)
 * \@Right(ApplicationRight.SendQuestion) // Specify here the rights to check
 * \@Post()
 * async sendQuestion(@Body() body: SendQuestionDto) {
 *   // Do something granted for tokens...
 * }
 * ```
 *
 * Example usage inside a request:
 * ```ts
 * \@UseGuards(JwtOrAnonymousAuthGuard, RightsGuard)
 * \@Right(ApplicationRight.ARight)
 * \@Get()
 * async myMethod(@Req() req: Request) {
 *   if (RightsGuard.hasRights(req, ApplicationRight.AnotherRight)) {
 *     // Right {AnotherRight} is granted for this token, or the user is not logged in
 *   }
 * }
 * ```
 */
@Injectable()
export class RightsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  static hasRights(request: Request, ...rights: EApplicationRight[]) {
    const user = request.user as RequestUserManager;

    // User is not logged, so we suppose that endpoint is allowed to everyone...
    if (!user) {
      return true;
    }

    return rights.every(right => user.hasRight(right));
  }

  canActivate(context: ExecutionContext) {
    const rights = this.reflector.get<EApplicationRight[]>(metaKey, context.getHandler()) ?? [];
    const request = context.switchToHttp().getRequest() as Request;

    const right = RightsGuard.hasRights(request, ...rights);

    if (!right) {
      throw ErrorService.throw(EApiError.InvalidTokenRights);
    }

    return true;
  }
}
