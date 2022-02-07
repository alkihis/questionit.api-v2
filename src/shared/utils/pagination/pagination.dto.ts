import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { NumberTransformer } from '../transformers.utils';

export class PaginationDto {
  @Transform(NumberTransformer)
  @IsInt()
  @IsOptional()
  @Min(0)
  page: number = 0;

  @Transform(NumberTransformer)
  @IsInt()
  @IsOptional()
  @Min(1)
  pageSize: number = 20;
}

export class PaginationWithIdsDto {
  @Transform(NumberTransformer)
  @IsInt()
  @IsOptional()
  untilId?: number;

  @Transform(NumberTransformer)
  @IsInt()
  @IsOptional()
  sinceId?: number;

  @IsString()
  @IsIn(['ASC', 'DESC'])
  order: 'ASC' | 'DESC';

  @Transform(NumberTransformer)
  @IsInt()
  @IsOptional()
  @Min(1)
  pageSize: number = 20;
}
