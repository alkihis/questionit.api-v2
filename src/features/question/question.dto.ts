import { IsBoolean, IsDate, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { BooleanTransformer, DateTimeTransformer, NumberTransformer } from '../../shared/utils/transformers.utils';
import config from '../../shared/config/config';
import { TDayQuestionLanguage } from '../../database/entities/day.question.entity';
import { PaginationWithIdsDto } from '../../shared/utils/pagination/pagination.dto';

export class GetQuestionOfTheDayDto {
  @IsDate()
  @Transform(DateTimeTransformer)
  date: Date;
}

export class MakeQuestionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(config.LIMITS.QUESTION_LENGTH)
  content: string;

  @IsInt()
  to: number;

  @IsOptional()
  @IsInt()
  inReplyToQuestionId: number;

  @IsOptional()
  @IsInt()
  pollId?: number;
}

export class AnswerQuestionDto {
  @IsString()
  @MaxLength(config.LIMITS.ANSWER_LENGTH)
  answer: string;

  @IsOptional()
  @IsBoolean()
  @Transform(BooleanTransformer)
  isQuestionOfTheDay?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(config.DAY_QUESTIONS.LANGUAGES)
  dayQuestionLanguage?: TDayQuestionLanguage;

  @IsOptional()
  @IsBoolean()
  @Transform(BooleanTransformer)
  postQuestionOnTwitter?: boolean;
}

export class GetQuestionOfUserDto extends PaginationWithIdsDto {
  order = 'DESC' as const;

  @Max(30)
  pageSize: number;
}

export class GetWaitingQuestionsDto extends PaginationWithIdsDto {
  order = 'DESC' as const;

  @Max(30)
  pageSize: number;

  @IsOptional()
  @IsBoolean()
  @Transform(BooleanTransformer)
  muted?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(BooleanTransformer)
  markAsSeen?: boolean;
}

export class GetQuestionAncestorsDto {
  @IsInt()
  @IsOptional()
  @Transform(NumberTransformer)
  pageSize: number = 10;
}

export class GetQuestionRepliesDto extends PaginationWithIdsDto {
  order = 'DESC' as const;

  @Max(30)
  pageSize: number = 10;
}

export class GetQuestionTimelineDto extends PaginationWithIdsDto {
  order = 'DESC' as const;

  @Max(50)
  pageSize: number = 20;
}
