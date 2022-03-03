import { EntityManager, getConnection } from 'typeorm';
import { AsyncLocalStorage } from 'async_hooks';

export const legacyConnectionName = 'legacyConnection';

export function getLegacyConnection() {
  return getConnection(legacyConnectionName);
}

export function selectFromAlias(alias: string, items: string[]) {
  return items.map(i => `${alias}.${i}`);
}

export class MigrationTransactionContext {
  static als = new AsyncLocalStorage<{ db: EntityManager, legacy: EntityManager }>();

  static get manager() {
    return this.als.getStore();
  }

  static get db() {
    return this.manager.db;
  }

  static get legacy() {
    return this.manager.legacy;
  }

  static async run(transactionScopeHandler: () => Promise<any>) {
    const queryRunner = getConnection().createQueryRunner();
    const legacyQueryRunner = getLegacyConnection().createQueryRunner();

    await queryRunner.connect();
    await legacyQueryRunner.connect();
    await queryRunner.startTransaction();
    await legacyQueryRunner.startTransaction();

    try {
      await new Promise((resolve, reject) => {
        this.als.run({ db: queryRunner.manager, legacy: legacyQueryRunner.manager }, () => {
          Promise.resolve(transactionScopeHandler())
            .then(resolve)
            .catch(reject);
        });
      });

      await queryRunner.commitTransaction();
      await legacyQueryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
      await legacyQueryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
      await legacyQueryRunner.release();
    }
  }
}

export class MigrationMappingContext {
  static als = new AsyncLocalStorage<MigrationMap>();

  static get map() {
    return this.als.getStore();
  }

  static async run(callback: () => any) {
    this.als.run(new MigrationMap(), () => callback());
  }
}

export class MigrationMap {
  // raw
  public users: Map<number, number> = new Map();
  public questions: Map<number, number> = new Map();
  public likes: Map<number, number> = new Map();

  // linkings
  // pinned: old user ID > old question ID
  public pinnedQuestionsToAttach: Map<number, number> = new Map();
  // answers: oldQuestionId > newAnswerId
  public answers: Map<number, number> = new Map();
}
