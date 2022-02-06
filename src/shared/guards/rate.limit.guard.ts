import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { RequestUserManager } from '../managers/request.user.manager';
import { ErrorService } from '../modules/errors/error.service';
import { EApiError } from '../modules/errors/error.enum';
import config from '../config/config';
import { Timing } from '../utils/time.utils';

export const RateLimit = (limit: number = config.RATE_LIMITING.DEFAULT_LIMIT, ttl: number | Timing = config.RATE_LIMITING.DEFAULT_TTL) =>
  Throttle(limit, ttl instanceof Timing ? ttl.asSeconds : ttl);

/**
 * Prevent overuse of endpoints.
 *
 * Example usage within an endpoint:
 * ```ts
 * \@UseGuards(JwtAuthGuard, RateLimitGuard) // Specify RateLimitGuard **after** the JWT check (it needs it, otherwise it will use IP)
 * \@Post()
 * async sendQuestion(@Body() body: SendQuestionDto) {
 *   // Do something granted for tokens...
 * }
 * ```
 */
@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  protected getTracker(req: Request): string {
    const loggedUser = req.user as RequestUserManager;

    if (loggedUser) {
      return `logged-user-${loggedUser.id}`;
    }
    // Fallback to IP tracking if user is not logged
    return req.ips.length ? req.ips[0] : req.ip;
  }

  protected throwThrottlingException() {
    throw ErrorService.throw(EApiError.TooManyRequests);
  }
}
