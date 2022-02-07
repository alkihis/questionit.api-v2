import { IsBoolean, IsDate, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
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

  @IsInt()
  questionId: number;

  @IsOptional()
  @IsBoolean()
  isQuestionOfTheDay?: boolean;

  @IsOptional()
  @IsString()
  @IsIn(config.DAY_QUESTIONS.LANGUAGES)
  dayQuestionLanguage?: TDayQuestionLanguage;

  @IsOptional()
  @IsBoolean()
  postQuestionOnTwitter?: boolean;
}

export class GetQuestionOfUserDto extends PaginationWithIdsDto {
  order = 'DESC' as const;

  @Max(30)
  pageSize: number;

  @IsInt()
  @IsOptional()
  @Transform(NumberTransformer)
  userId: number;
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
