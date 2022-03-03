import { Injectable, Logger } from '@nestjs/common';
import { MigrationMappingContext, MigrationTransactionContext, selectFromAlias } from '../v1.migration.utils';
import { Relationship } from '../../database/entities/relationship.entity';

@Injectable()
export class V1MigrationRelationshipService {
  async migrate() {
    Logger.log(`Starting follows migration...`);
    const time = Date.now();

    const db = MigrationTransactionContext.db;
    const legacyDb = MigrationTransactionContext.legacy;

    const follows = await legacyDb
      .createQueryBuilder()
      .select(selectFromAlias('f', ['from_id', 'to_id']))
      .from('follow', 'f')
      .getRawMany();

    const toInsert: Relationship[] = [];

    for (const follow of follows) {
      const fromOldId = Number(follow.from_id);
      const toOldId = Number(follow.to_id);

      const fromNewId = MigrationMappingContext.map.users.get(fromOldId);
      const toNewId = MigrationMappingContext.map.users.get(toOldId);

      if (fromNewId && toNewId) {
        const item = db.getRepository(Relationship).create({
          createdAt: new Date(),
          updatedAt: new Date(),
          fromUserId: fromNewId,
          toUserId: toNewId,
        });

        toInsert.push(item);
      } else {
        Logger.error(`ERROR: Missing linking to user ${fromOldId} and user ${toOldId} for following`);
      }
    }

    Logger.log(`Migrated ${toInsert.length} follows in ${Date.now() - time}ms.`);
    await db.getRepository(Relationship).save(toInsert);
  }
}
