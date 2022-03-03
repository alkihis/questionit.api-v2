import { Injectable, Logger } from '@nestjs/common';
import { MigrationMappingContext, MigrationTransactionContext, selectFromAlias } from '../v1.migration.utils';
import { Block } from '../../database/entities/block.entity';

@Injectable()
export class V1MigrationBlocksService {
  async migrate() {
    Logger.log(`Starting blocks migration...`);
    const time = Date.now();

    const db = MigrationTransactionContext.db;
    const legacyDb = MigrationTransactionContext.legacy;

    const blocks = await legacyDb
      .createQueryBuilder()
      .select(selectFromAlias('b', ['emitter_id', 'blocked_id']))
      .from('block', 'b')
      .getRawMany();

    const toInsert: Block[] = [];

    for (const block of blocks) {
      const fromOldId = Number(block.emitter_id);
      const toOldId = Number(block.blocked_id);

      const fromNewId = MigrationMappingContext.map.users.get(fromOldId);
      const toNewId = MigrationMappingContext.map.users.get(toOldId);

      if (fromNewId && toNewId) {
        const item = db.getRepository(Block).create({
          createdAt: new Date(),
          updatedAt: new Date(),
          ownerId: fromNewId,
          targetId: toNewId,
        });

        toInsert.push(item);
      } else {
        Logger.error(`ERROR: Missing linking to user ${fromOldId} and user ${toOldId} for block.`);
      }
    }

    Logger.log(`Migrated ${toInsert.length} blocks in ${Date.now() - time}ms.`);
    await db.getRepository(Block).save(toInsert);
  }
}
