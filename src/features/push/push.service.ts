import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectDataSource } from '@nestjs/typeorm';
import { Connection, DataSource } from 'typeorm';
import urlSafeBase64 from 'urlsafe-base64';
import config from '../../shared/config/config';
import { JwtService } from '@nestjs/jwt';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './push.dto';
import { ErrorService } from '../../shared/modules/errors/error.service';
import { User } from '../../database/entities/user.entity';
import { EApiError } from '../../shared/modules/errors/error.enum';
import { IFullJwt } from '../../shared/strategies/jwt.stategy';
import { Token } from '../../database/entities/token.entity';
import { PushMessage } from '../../database/entities/push.message.entity';
import { IPushMessageContentJsonbModel } from '../../database/interfaces/push.message.interface';
import { RequestContextService } from '../../shared/modules/context/request.context.service';

@Injectable()
export class PushService {
  constructor(
    @InjectDataSource() private db: DataSource,
    private readonly jwtService: JwtService,
    private readonly requestContextService: RequestContextService,
  ) {}

  private static readonly VAPID_PUBLIC_KEY_DECODED = urlSafeBase64.decode(config.VAPID.PUBLIC);

  getServerKey() {
    // Procedure comes from https://rossta.net/blog/using-the-web-push-api-with-vapid.html
    return PushService.VAPID_PUBLIC_KEY_DECODED.toJSON().data;
  }

  async createPushSubscription(body: CreateSubscriptionDto) {
    const user = this.requestContextService.user;
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

  async updatePushRequest(body: UpdateSubscriptionDto) {
    const user = this.requestContextService.user;

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
    await this.db.getRepository(PushMessage)
      .update({ targetUserId: user.id, endpoint: body.endpoint }, { targetUserId: targetUser.id });
  }

  async deletePushSubscription(endpoint: string) {
    await this.db.getRepository(PushMessage)
      .createQueryBuilder('msg')
      .delete()
      .where('endpoint = :endpoint', { endpoint })
      .andWhere('targetUserId = :userId', { userId: this.requestContextService.user.id })
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
