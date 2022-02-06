import type { Connection } from 'typeorm';
import { EntityManager } from 'typeorm';

type Constructible<T> = { new(...args: any): T };

export const updateEntityValues = <T>(entity: T, values: Partial<{ [K in keyof T]: T[K] }>) => {
  for (const key in values) {
    entity[key] = values[key];
  }

  return entity;
};

/**
 * Load a relation of an entity without having to manually setup the query builder.
 * Returns the relation value and register the relation into the entity automatically.
 *
 * Example:
 * ```ts
 * const user = await db.getRepository(User)
 *  .createQueryBuilder('u')
 *  .where('u.id = :userId', { userId })
 *  .getOne();
 *
 * console.log(user.likes) // not loaded, => undefined
 * const likes = await loadRelationOfEntity(reader, user, 'likes');
 * console.log(likes === user.likes && !!user.likes) // => now loaded, true
 * ```
 */
export const loadRelationOfEntity = async <T, K extends keyof T>(connection: Connection, entity: T, propName: K): Promise<T[K]> => {
  const model: Constructible<T> = entity.constructor as any as Constructible<T>;
  const modelName = model.name;
  const { relations } = connection.getMetadata(modelName);

  const relationData = relations.find((o) => o.propertyName === propName);

  if (!relationData) {
    throw new Error(`Relation "${propName}" could not be found on ${modelName}.`);
  }

  const { relationType } = relationData;

  const qb = connection.manager
    .createQueryBuilder()
    .relation(model, propName as string)
    .of(entity);

  if (['one-to-one', 'many-to-one'].includes(relationType)) {
    const data = await qb.loadOne();
    entity[propName] = data;

    return data;
  }

  if (['one-to-many', 'many-to-many'].includes(relationType)) {
    const data = await qb.loadMany() as any as T[K];
    entity[propName] = data;

    return data;
  }

  throw new Error(
    `Error on relation "${propName}" of entity "${modelName}": Unknown relation type "${relationType}`,
  );
};

export const wrapTransaction = async (
  connection: Connection,
  transactionScopeHandler: (manager: EntityManager) => Promise<any>,
) => {
  const queryRunner = connection.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    await transactionScopeHandler(queryRunner.manager);
    await queryRunner.commitTransaction();
  } catch (e) {
    await queryRunner.rollbackTransaction();
    throw e;
  } finally {
    await queryRunner.release();
  }
};
