import { SelectQueryBuilder } from 'typeorm';
import { PaginationDto, PaginationWithIdsDto } from './pagination.dto';

export interface IPaginatedResult<T> {
  items: T[];
  nextPage?: number;
  previousPage?: number;
  page: number;
  count: number;
}

export interface IPaginatedWithIdsResult<T> {
  items: T[];
  nextSinceId?: string;
  nextUntilId?: string;
}

export interface IPaginateWithIdsParams<T extends { id: number }, R = T> {
  qb: SelectQueryBuilder<T>;
  paginationDto: PaginationWithIdsDto;
  convertItems?: (items: T[]) => Promise<R[]>;
}

interface IPaginateParams<T, R = T> {
  qb: SelectQueryBuilder<T>;
  paginationDto: PaginationDto;
  convertItems?: (items: T[]) => Promise<R[]>;
}

export async function paginate<T, R = T>({ qb, paginationDto, convertItems }: IPaginateParams<T, R>) {
  const take = paginationDto.pageSize;
  const skip = paginationDto.page * take;

  const [items, count] = await qb.take(take).skip(skip).getManyAndCount();

  const result: IPaginatedResult<R> = {
    items: convertItems ? await convertItems(items) : items as any as R[],
    count,
    page: paginationDto.page,
  };

  if (paginationDto.page > 0) {
    result.previousPage = paginationDto.page - 1;
  }

  const currentViewedCount = skip + items.length;

  if (count > currentViewedCount) {
    result.nextPage = paginationDto.page + 1;
  }

  return result;
}

export async function paginateWithIds<T extends { id: number }, R = T>({ qb, paginationDto, convertItems }: IPaginateWithIdsParams<T, R>) {
  const alias = qb.alias;

  if (paginationDto.sinceId) {
    qb.andWhere(`${alias}.id > :sinceId`, { sinceId: paginationDto.sinceId });
  }
  if (paginationDto.untilId) {
    qb.andWhere(`${alias}.id < :untilId`, { untilId: paginationDto.untilId });
  }

  const items = await qb
    .take(paginationDto.pageSize)
    .orderBy(`${alias}.id`, paginationDto.order || 'ASC')
    .getMany();

  const result: IPaginatedWithIdsResult<R> = {
    items: convertItems ? await convertItems(items) : items as any as R[],
  };

  if (items.length === paginationDto.pageSize) {
    // There is elements before
    const lowestId = items.reduce((prev, cur) => prev < cur.id ? prev : cur.id, items[0].id);
    result.nextUntilId = lowestId.toString();
  }

  if (items.length) {
    // There can be elements after
    const highestId = items.reduce((prev, cur) => prev > cur.id ? prev : cur.id, items[0].id);
    result.nextSinceId = highestId.toString();
  } else if (paginationDto.untilId) {
    result.nextSinceId = paginationDto.untilId.toString();
  }

  return result;
}
