import { PaginationWithIdsDto } from '../../shared/utils/pagination/pagination.dto';
import { IsBoolean, IsOptional, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { BooleanTransformer } from '../../shared/utils/transformers.utils';

export class ListNotificationDto extends PaginationWithIdsDto {
  order = 'DESC' as const;

  @Max(30)
  pageSize: number = 10;

  @IsOptional()
  @IsBoolean()
  @Transform(BooleanTransformer)
  markAsSeen?: boolean;
}
