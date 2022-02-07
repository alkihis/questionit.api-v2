import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import urlSafeBase64 from 'urlsafe-base64';
import config from '../../shared/config/config';
import { JwtService } from '@nestjs/jwt';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './push.dto';
import { RequestUserManager } from '../../shared/managers/request.user.manager';
import { ErrorService } from '../../shared/modules/errors/error.service';
import { User } from '../../database/entities/user.entity';
import { EApiError } from '../../shared/modules/errors/error.enum';
import { IFullJwt } from '../../shared/strategies/jwt.stategy';
import { Token } from '../../database/entities/token.entity';
import { PushMessage } from '../../database/entities/push.message.entity';
import { IPushMessageContentJsonbModel } from '../../database/interfaces/push.message.interface';

@Injectable()
export class PushService {
  constructor(
    @InjectConnection() private db: Connection,
    private readonly jwtService: JwtService,
  ) {}

  private static readonly VAPID_PUBLIC_KEY_DECODED = urlSafeBase64.decode(config.VAPID.PUBLIC);

  getServerKey() {
    // Procedure comes from https://rossta.net/blog/using-the-web-push-api-with-vapid.html
    return PushService.VAPID_PUBLIC_KEY_DECODED.toJSON().data;
  }

  async createPushSubscription(user: RequestUserManager, body: CreateSubscriptionDto) {
    this.ensurePushSubscriptionKeysAreOk(body.keys);

    const subscription: PushSubscriptionJSON = {
      endpoint: body.endpoint,
      expirationTime: body.expirationTime,
      keys: body.keys,
    };

    // Save object in database
    await this.db.getRepository(PushMessage).save(
      this.db.getRepository(PushMessage).create({
        content: subscription as IPushMessageContentJsonbModel,
        endpoint: subscription.endpoint,
        targetUserId: user.id,
      }),
    );

    return { subscription: subscription.endpoint };
  }

  async updatePushRequest(user: RequestUserManager, body: UpdateSubscriptionDto) {
    const targetUser = await ErrorService.fulfillOrHttpException(
      this.db.getRepository(User).findOneOrFail({ where: { id: Number(body.target) || 0 } }),
      EApiError.UserNotFound,
    );

    const decodedToken = await ErrorService.fulfillOrHttpException(
      this.jwtService.verifyAsync<IFullJwt>(body.token),
      EApiError.InvalidExpiredToken,
    );

    const linkedTokenEntity = await ErrorService.fulfillOrHttpException(
      this.db.getRepository(Token).findOneOrFail({ where: { jti: decodedToken.jti, ownerId: targetUser.id } }),
      EApiError.InvalidExpiredToken,
    );

    Logger.debug(`Changed notification handler for token #${linkedTokenEntity.id} from ${user.slug} to ${targetUser.slug}`);

    // Change receiver of notifications from one user to another.
    // TODO: Improve, notifications could be sent to all users of a device.
    // TODO: It can be registred through the login process.
    await this.db.getRepository(PushMessage)
      .update({ targetUserId: user.id, endpoint: body.endpoint }, { targetUserId: targetUser.id });
  }

  async deletePushSubscription(user: RequestUserManager, endpoint: string) {
    await this.db.getRepository(PushMessage)
      .createQueryBuilder('msg')
      .delete()
      .where('endpoint = :endpoint', { endpoint })
      .andWhere('targetUserId = :userId', { userId: user.id })
      .execute();
  }

  private ensurePushSubscriptionKeysAreOk(keys: Record<string, string>) {
    if (Object.keys(keys).length >= 5) {
      throw ErrorService.throw(EApiError.InvalidParameter);
    }

    for (const prop in keys) {
      if (typeof prop !== 'string' || typeof keys[prop] !== 'string' || keys[prop].length > 512) {
        throw ErrorService.throw(EApiError.InvalidParameter);
      }
    }
  }
}
