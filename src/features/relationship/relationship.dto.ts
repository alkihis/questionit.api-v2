import { PaginationDto } from '../../shared/utils/pagination/pagination.dto';
import { Max } from 'class-validator';

export class ListFollowersOrFollowingsDto extends PaginationDto {
  @Max(30)
  pageSize: number = 10;
}
