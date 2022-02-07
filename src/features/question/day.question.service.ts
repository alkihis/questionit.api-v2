import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import RandomSeed from 'random-seed';
import { RequestUserManager } from '../../shared/managers/request.user.manager';
import { ErrorService } from '../../shared/modules/errors/error.service';
import { EApiError } from '../../shared/modules/errors/error.enum';
import config from '../../shared/config/config';
import { DayQuestion, TDayQuestionLanguage } from '../../database/entities/day.question.entity';
import { DateTime } from 'luxon';
import { SendableSharedService } from '../../shared/modules/sendable/sendable.shared.service';

@Injectable()
export class DayQuestionService {
  constructor(
    @InjectConnection() private db: Connection,
    private sendableService: SendableSharedService,
  ) {}

  async getQuestionOfTheDay(user: RequestUserManager, lang: TDayQuestionLanguage, date: Date) {
    if (isNaN(date.getTime())) {
      throw ErrorService.throw(EApiError.InvalidParameter);
    }

    if (!config.DAY_QUESTIONS.LANGUAGES.includes(lang as any)) {
      throw ErrorService.throw(EApiError.UnsupportedLanguage);
    }

    const dayQuestion = await this.getInternalQuestionOfTheDay(date);
    if (!dayQuestion) {
      throw ErrorService.throw(EApiError.ServerError);
    }

    return await this.sendableService.getSendableQuestionFromDayQuestion(dayQuestion, { context: user.entity, lang });
  }

  private async getInternalQuestionOfTheDay(date: Date) {
    const dayQuestionQb = this.db.getRepository(DayQuestion)
      .createQueryBuilder('dayq')
      .select(['dayq.id', 'dayq.content'])
      .where('dayq.hidden = FALSE');

    if (config.DAY_QUESTIONS.FORCED_CURRENT) {
      dayQuestionQb.andWhere('dayq.id = :forcedId', { forcedId: config.DAY_QUESTIONS.FORCED_CURRENT });
    }

    const dayQuestions = await dayQuestionQb.getMany();

    if (dayQuestions.length <= 1) {
      return dayQuestions[0];
    }

    const dayAsString = DateTime.fromJSDate(date).toFormat('dd/MM/yyyy');
    const idGenerator = RandomSeed.create(dayAsString);
    const dayQuestionIndex = idGenerator.range(dayQuestions.length);

    return dayQuestions[dayQuestionIndex];
  }
}
