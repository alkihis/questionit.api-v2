import { Injectable, Logger } from '@nestjs/common';
import { MigrationMappingContext, MigrationTransactionContext, selectFromAlias } from '../v1.migration.utils';
import { PushMessage } from '../../database/entities/push.message.entity';

@Injectable()
export class V1MigrationPushMessageService {
  async migrate() {
    Logger.log(`Starting push subscriptions migration...`);
    const time = Date.now();

    const db = MigrationTransactionContext.db;
    const legacyDb = MigrationTransactionContext.legacy;

    const pushMessages = await legacyDb
      .createQueryBuilder()
      .select(selectFromAlias('p', ['endpoint', 'content', 'target_id']))
      .from('push_message', 'p')
      .getRawMany();

    const toInsert: PushMessage[] = [];

    for (const message of pushMessages) {
      const toOldUserId = Number(message.target_id);
      const toNewId = MigrationMappingContext.map.users.get(toOldUserId);

      if (toNewId) {
        const item = db.getRepository(PushMessage).create({
          createdAt: new Date(),
          updatedAt: new Date(),
          endpoint: message.endpoint,
          content: JSON.parse(message.content),
          targetUserId: toNewId,
        });

        toInsert.push(item);
      } else {
        Logger.error(`ERROR: Missing linking to user ${toOldUserId} for push message ${message.endpoint}.`);
      }
    }

    Logger.log(`Migrated ${toInsert.length} push subscriptions in ${Date.now() - time}ms.`);
    await db.getRepository(PushMessage).save(toInsert);
  }
}
