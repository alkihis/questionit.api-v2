import { Injectable, Logger } from '@nestjs/common';
import { MigrationMappingContext, MigrationTransactionContext, selectFromAlias } from '../v1.migration.utils';
import { Like } from '../../database/entities/like.entity';

@Injectable()
export class V1MigrationLikeService {
  async migrate() {
    Logger.log(`Starting likes migration...`);
    const time = Date.now();

    const db = MigrationTransactionContext.db;
    const legacyDb = MigrationTransactionContext.legacy;

    const likes = await legacyDb
      .createQueryBuilder()
      .select(selectFromAlias('l', ['emitter_id', 'receiver_id']))
      .from('like', 'l')
      .getRawMany();

    const toInsert: Like[] = [];

    for (const like of likes) {
      const fromOldId = Number(like.emitter_id);
      const toOldId = Number(like.receiver_id);

      const fromNewId = MigrationMappingContext.map.users.get(fromOldId);
      const toNewId = MigrationMappingContext.map.answers.get(toOldId);

      if (fromNewId && toNewId) {
        const item = db.getRepository(Like).create({
          createdAt: new Date(),
          updatedAt: new Date(),
          emitterId: fromNewId,
          answerId: toNewId,
        });

        toInsert.push(item);
      } else {
        Logger.error(`ERROR: Missing linking to user ${fromOldId} and question ${toOldId} for like.`);
      }
    }

    Logger.log(`Migrated ${toInsert.length} likes in ${Date.now() - time}ms.`);
    await db.getRepository(Like).save(toInsert);
  }
}
