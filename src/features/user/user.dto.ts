import { PaginationWithIdsDto } from '../../shared/utils/pagination/pagination.dto';
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength } from 'class-validator';
import config from '../../shared/config/config';
import { Transform } from 'class-transformer';
import { BooleanTransformer } from '../../shared/utils/transformers.utils';

export class SearchUserDto extends PaginationWithIdsDto {
  order = 'DESC' as const;

  @Max(100)
  pageSize: number;

  @IsString()
  @MaxLength(48)
  q: string;
}

export class BlockedWordsDto {
  @IsString({ each: true })
  @IsArray()
  @Matches(config.LIMITS.BLOCKED_WORDS_REGEX, { each: true })
  words: string[];
}

export class EditUserDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(config.LIMITS.NAME_REGEX)
  name?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Matches(config.LIMITS.SLUG_REGEX)
  slug?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(config.LIMITS.ASK_ME_MESSAGE_LIMIT)
  askMeMessage?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(BooleanTransformer)
  allowAnonymousQuestions?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(BooleanTransformer)
  sendQuestionsToTwitterByDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(BooleanTransformer)
  allowQuestionOfTheDay?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(BooleanTransformer)
  safeMode?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(BooleanTransformer)
  visible?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(BooleanTransformer)
  dropQuestionsOnBlockedWord?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(BooleanTransformer)
  useRocketEmojiInQuestions?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  @Matches(/^([A-Z_-]+[A-Z0-9_-]*)?$/ig)
  useHashtagInQuestions?: string;
}
