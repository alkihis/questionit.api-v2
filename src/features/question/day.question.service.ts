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
import { Question } from '../../database/entities/question.entity';
import { v4 as uuid } from 'uuid';

@Injectable()
export class DayQuestionService {
  constructor(
    @InjectConnection() private db: Connection,
    private sendableService: SendableSharedService,
  ) {}

  async getQuestionOfTheDay(user: RequestUserManager, lang: TDayQuestionLanguage, date: Date) {
    const dayQuestion = await this.getQuestionOfTheDayEntity(user, lang, date);
    return await this.sendableService.getSendableQuestionFromDayQuestion(dayQuestion, { context: user.entity, lang });
  }

  async getQuestionEntityForQuestionOfTheDay(user: RequestUserManager, lang: TDayQuestionLanguage, dayQuestionId: number) {
    const dayQuestion = await this.getQuestionOfTheDayEntity(user, lang, dayQuestionId);

    return this.db.getRepository(Question).create({
      content: dayQuestion.content[lang],
      seen: true,
      conversationId: uuid(),
      questionOfTheDayId: dayQuestion.id,
      receiverId: user.id,
    });
  }

  private async getQuestionOfTheDayEntity(user: RequestUserManager, lang: TDayQuestionLanguage, dateOrId: Date | number) {
    if (dateOrId instanceof Date && isNaN(dateOrId.getTime())) {
      throw ErrorService.throw(EApiError.InvalidParameter);
    }

    if (!config.DAY_QUESTIONS.LANGUAGES.includes(lang as any)) {
      throw ErrorService.throw(EApiError.UnsupportedLanguage);
    }

    const dayQuestion = await this.getInternalQuestionOfTheDay(dateOrId);
    if (!dayQuestion) {
      throw ErrorService.throw(EApiError.ServerError);
    }

    // Check if user has already replied to this day question
    const hasReplied = await this.db.getRepository(Question)
      .findOne({ where: { receiverId: user.id, questionOfTheDayId: dayQuestion.id } });

    if (hasReplied) {
      throw ErrorService.throw(EApiError.AlreadyAnswered, { questionId: hasReplied.id });
    }

    return dayQuestion;
  }

  private async getInternalQuestionOfTheDay(dateOrId: Date | number) {
    const dayQuestionQb = this.db.getRepository(DayQuestion)
      .createQueryBuilder('dayq')
      .select(['dayq.id', 'dayq.content'])
      .where('dayq.hidden = FALSE');

    if (typeof dateOrId === 'number') {
      dayQuestionQb.andWhere('dayq.id = :forcedId', { forcedId: dateOrId });
    } else if (config.DAY_QUESTIONS.FORCED_CURRENT) {
      dayQuestionQb.andWhere('dayq.id = :forcedId', { forcedId: config.DAY_QUESTIONS.FORCED_CURRENT });
    }

    const dayQuestions = await dayQuestionQb.getMany();

    if (dayQuestions.length <= 1 || typeof dateOrId === 'number') {
      return dayQuestions[0];
    }

    const dayAsString = DateTime.fromJSDate(dateOrId).toFormat('dd/MM/yyyy');
    const idGenerator = RandomSeed.create(dayAsString);
    const dayQuestionIndex = idGenerator.range(dayQuestions.length);

    return dayQuestions[dayQuestionIndex];
  }
}
