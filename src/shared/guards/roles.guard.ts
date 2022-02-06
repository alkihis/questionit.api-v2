import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { RequestUserManager } from '../managers/request.user.manager';
import { ErrorService } from '../modules/errors/error.service';
import { EApiError } from '../modules/errors/error.enum';
import { ERole } from '../modules/roles/role.enum';

const metaKey = '_userRoles_';

export const Role = (...rights: ERole[]) => SetMetadata(metaKey, rights);

/**
 * ```ts
 * \@UseGuards(JwtAuthGuard, RolesGuard) // Specify RolesGuard **after** the JWT check (it needs it)
 * \@Role(ERole.Admin) // Specify here the roles to check
 * \@Post()
 * async manageAdminQuestion(@Body() body: SendQuestionDto) {
 *   // Do something granted for role...
 * }
 * ```
 *
 * Example usage inside a request:
 * ```ts
 * \@Get()
 * async myMethod(@Req() req: Request) {
 *   if (RolesGuard.isOneOfRole(req, ERole.Admin)) {
 *     // do something a regular request wasnt allowed to do
 *   }
 * }
 * ```
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  static isOneOfRole(request: Request, ...roles: ERole[]) {
    const user = request.user as RequestUserManager;
    if (!user) {
      return false;
    }

    return roles.some(role => user.role === role);
  }

  canActivate(context: ExecutionContext) {
    const roles = this.reflector.get<ERole[]>(metaKey, context.getHandler()) ?? [];
    const request = context.switchToHttp().getRequest() as Request;

    const isOk = RolesGuard.isOneOfRole(request, ...roles);

    if (!isOk) {
      throw ErrorService.throw(EApiError.InvalidRole);
    }

    return true;
  }
}
