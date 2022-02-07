import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import config from '../../shared/config/config';

export class MakePollDto {
  @IsArray()
  @IsString({ each: true })
  @MaxLength(config.LIMITS.POLL_OPTION_LENGTH, { each: true })
  @IsNotEmpty({ each: true })
  @ArrayMinSize(2)
  @ArrayMaxSize(4)
  @ArrayUnique()
  options: string[];
}
