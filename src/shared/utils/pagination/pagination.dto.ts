import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class PaginationDto {
  @Transform(({ value }) => Number(value))
  @IsInt()
  @IsOptional()
  @Min(0)
  page: number = 0;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @IsOptional()
  @Min(1)
  pageSize: number = 20;
}

export class PaginationWithIdsDto {
  @Transform(({ value }) => Number(value))
  @IsInt()
  @IsOptional()
  untilId?: number;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @IsOptional()
  sinceId?: number;

  @IsString()
  @IsIn(['ASC', 'DESC'])
  order: 'ASC' | 'DESC';

  @Transform(({ value }) => Number(value))
  @IsInt()
  @IsOptional()
  @Min(1)
  pageSize: number = 20;
}
