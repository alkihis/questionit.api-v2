import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import webpush from 'web-push';
import { TNotificationContentPayload } from '../../../database/interfaces/notification.interface';
import { PushMessage } from '../../../database/entities/push.message.entity';
import config from '../../config/config';

webpush.setVapidDetails(
  config.VAPID.EMAIL,
  config.VAPID.PUBLIC,
  config.VAPID.PRIVATE,
);

@Injectable()
export class NotificationSharedService {
  constructor(
    @InjectConnection() private db: Connection,
  ) {}

  async pushNotification(pushSubscriptions: PushMessage | PushMessage[], content: TNotificationContentPayload) {
    const subscriptions = Array.isArray(pushSubscriptions) ? pushSubscriptions : [pushSubscriptions];
    const notificationContent = JSON.stringify(content);

    for (const pushSubscription of subscriptions) {
      const subscription: webpush.PushSubscription = {
        endpoint: pushSubscription.endpoint,
        keys: {
          auth: pushSubscription.content.keys.auth,
          p256dh: pushSubscription.content.keys.p256dh,
        },
      };
      const options = { TTL: 24 * 60 * 60 };

      try {
        await webpush.sendNotification(subscription, notificationContent, options);
      } catch (e) {
        // Invalid sub
        if (e && e.statusCode === 410) {
          // User has revoked subscription, delete it.
          await this.db.getRepository(PushMessage).delete({ id: pushSubscription.id })
            .catch(() => {});
        }
        else {
          Logger.error('Invalid web-push sent, details:');
          Logger.error([e?.stack, e?.body, e?.statusCode]);
        }
      }
    }
  }
}
