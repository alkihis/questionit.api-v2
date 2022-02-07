import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection, In } from 'typeorm';
import { RequestUserManager } from '../../shared/managers/request.user.manager';
import { GetQuestionOfUserDto, GetWaitingQuestionsDto, MakeQuestionDto } from './question.dto';
import { ErrorService } from '../../shared/modules/errors/error.service';
import { User } from '../../database/entities/user.entity';
import { EApiError } from '../../shared/modules/errors/error.enum';
import { SendableSharedService } from '../../shared/modules/sendable/sendable.shared.service';
import { BlockSharedService } from '../../shared/modules/blocks/block.shared.service';
import { Question } from '../../database/entities/question.entity';
import { Poll } from '../../database/entities/poll.entity';
import config from '../../shared/config/config';
import { Request } from 'express';
import { BannedIpGuard } from '../../shared/guards/banned.ip.guard';
import { v4 as uuid } from 'uuid';
import { MutedWordsManager } from '../../shared/managers/muted-words/muted.words.manager';
import { ISentQuestion } from '../../database/interfaces/question.interface';
import { NotificationSharedService } from '../../shared/modules/notifications/notification.shared.service';
import { ENotificationType, INotificationNewQuestionContentPayload } from '../../database/interfaces/notification.interface';
import { paginateWithIds } from '../../shared/utils/pagination/pagination.utils';
import { Answer } from '../../database/entities/answer.entity';
import { EApplicationRight } from '../../database/enums/questionit.application.enum';

interface ICreateQuestionFromDtoArgs {
  user: RequestUserManager | undefined;
  targetUser: User;
  dto: MakeQuestionDto;
  emitterIp: string;
  asAnonymous: boolean;
}

@Injectable()
export class QuestionService {
  constructor(
    @InjectConnection() private db: Connection,
    private sendableService: SendableSharedService,
    private blockService: BlockSharedService,
    private notificationService: NotificationSharedService,
  ) {}

  /** Question creation */

  async makeQuestion(request: Request, dto: MakeQuestionDto, asAnonymous: boolean) {
    const user = request.user;
    const emitterIp = request.ips?.[0] || request.ip;

    const targetUser = await ErrorService.fulfillOrHttpException(
      this.db.getRepository(User)
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.pushSubscriptions', 'subscriptions')
        .where('user.id = :userId', { userId: dto.to })
        .getOneOrFail(),
      EApiError.UserNotFound,
    );

    if (targetUser.safeMode && BannedIpGuard.isIpBanned(emitterIp, true)) {
      Logger.warn(`IP ${emitterIp} shadow-banned. Target user #${targetUser.id} has safe mode enabled, so question will be dropped immediately.`);
      return;
    }

    await this.ensureUserCanSendQuestion(user, targetUser, asAnonymous);

    const question = await this.createQuestionFromDto({
      user,
      targetUser,
      dto,
      emitterIp,
      asAnonymous,
    });

    if (!question) {
      // Question has been dropped for safety reasons
      return;
    }
    if (question.muted || user?.id === targetUser.id) {
      // Muted question or same user for sender and receiver
      return;
    }

    // Send notification
    const sendableQuestion = await this.sendableService.getSendableQuestion(question, {
      context: targetUser,
      withUserRelationships: true,
    });

    this.notifyForQuestion(targetUser, sendableQuestion)
      .catch(e => Logger.error(`Unable to send push notification to #${targetUser.id} for question #${question.id}:`, e));
  }

  private async ensureUserCanSendQuestion(user: RequestUserManager | undefined, targetUser: User, asAnonymous: boolean) {
    if (!user && !asAnonymous) {
      throw ErrorService.throw(EApiError.BadRequest);
    }
    if (!targetUser.allowAnonymousQuestions && asAnonymous) {
      throw ErrorService.throw(EApiError.DontAllowAnonymousQuestions);
    }
    if (!asAnonymous && user?.id === targetUser.id) {
      throw ErrorService.throw(EApiError.CantSendQuestionToYourself);
    }
    if (user) {
      await this.blockService.ensureNoBlocksExists(user.id, targetUser.id);
    }
  }

  private async createQuestionFromDto({ user, targetUser, dto, emitterIp, asAnonymous }: ICreateQuestionFromDtoArgs) {
    const repliedToQuestion = dto.inReplyToQuestionId ? await this.getRepliedQuestion(dto) : null;
    const linkedPoll = dto.pollId ? await this.getFreePollFromDto(dto) : null;
    const content = this.getCleanedQuestionText(dto.content);

    const question = this.db.getRepository(Question).create({
      content,
      ownerId: asAnonymous ? null : user?.id,
      privateOwnerId: user?.id,
      receiverId: targetUser.id,
      emitterIp,
      inReplyToQuestionId: repliedToQuestion?.id || null,
      conversationId: repliedToQuestion?.conversationId || uuid(),
    });

    const questionMutedForUser = await this.isQuestionMutedForUser(question, linkedPoll, targetUser);

    if (questionMutedForUser) {
      if (targetUser.dropQuestionsOnBlockedWord) {
        Logger.warn(`Question muted words shadow-banned for target user #${targetUser.id}. Emitter: ${emitterIp}: ${content}.`);
        return;
      }

      question.muted = true;
    }

    await this.db.getRepository(Question).save(question);

    if (linkedPoll) {
      linkedPoll.questionId = question.id;
      await this.db.getRepository(Poll).save(linkedPoll);
    }

    question.poll = linkedPoll;

    return question;
  }

  private async isQuestionMutedForUser(question: Question, poll: Poll | undefined, targetUser: User) {
    const matchMuted = targetUser.blockedWords.length > 0;
    const matchSafe = targetUser.safeMode;

    return await MutedWordsManager.match(
      poll ? [question.content, ...poll.options] : [question.content],
      targetUser.blockedWords,
      { matchMuted, matchSafe },
    );
  }

  private async notifyForQuestion(targetUser: User, question: ISentQuestion) {
    const notification = await this.notificationService.makeNotification({
      targetUserId: targetUser.id,
      type: ENotificationType.Question,
      relatedToId: question.id,
    });
    const pushNotificationContent: INotificationNewQuestionContentPayload = { id: notification.id, question };

    await this.notificationService.pushNotification(targetUser.pushSubscriptions, pushNotificationContent);
  }

  private async getRepliedQuestion(dto: MakeQuestionDto) {
    const question = await ErrorService.fulfillOrHttpException(
      this.db.getRepository(Question)
        .createQueryBuilder('question')
        .innerJoinAndSelect('question.answer', 'answer')
        .where('answer IS NOT NULL')
        .andWhere('question.id = :inReplyToQuestionId', { inReplyToQuestionId: dto.inReplyToQuestionId })
        .getOneOrFail(),
      EApiError.OriginalQuestionNotFound,
    );

    // If the receiver of the original question is different of the targeted user.
    if (question.receiverId !== dto.to) {
      throw ErrorService.throw(EApiError.AskedUserMismatch);
    }

    return question;
  }

  private async getFreePollFromDto(dto: MakeQuestionDto) {
    return await ErrorService.fulfillOrHttpException(
      this.db.getRepository(Poll)
        .createQueryBuilder('poll')
        .where('poll.questionId IS NULL')
        .andWhere('poll.id = :pollId', { pollId: dto.pollId })
        .getOneOrFail(),
      EApiError.TakenPoll,
    );
  }

  private getCleanedQuestionText(text: string) {
    const parts = text.split('\n');
    text = parts.slice(0, config.LIMITS.MAX_NEW_LINES_IN_QUESTIONS).join('\n')
      + ' '
      + parts.slice(config.LIMITS.MAX_NEW_LINES_IN_QUESTIONS).join(' ');

    return text
      .replace(/\n+/g, '\n')
      .replace(/\t/g, ' ')
      .trim();
  }

  /** Question reading */

  async listQuestionsOfUser(user: RequestUserManager | undefined, dto: GetQuestionOfUserDto) {
    const userId = dto.userId || user?.id;
    if (!userId) {
      throw ErrorService.throw(EApiError.MissingParameter);
    }

    await ErrorService.fulfillOrHttpException(
      this.db.getRepository(User).findOneOrFail({ where: { id: userId } }),
      EApiError.UserNotFound,
    );

    return paginateWithIds({
      qb: this.db.getRepository(Answer)
        .createQueryBuilder('answer')
        .innerJoinAndSelect('answer.question', 'question')
        .where('question.receiverId = :userId', { userId }),
      paginationDto: dto,
      convertItems: items => this.sendableService.getSendableQuestions(
        items.map(item => item.question),
        { context: user?.entity, withUserRelationships: user?.hasRight(EApplicationRight.ReadRelationship) },
      ),
    });
  }

  async listWaitingQuestions(user: RequestUserManager, dto: GetWaitingQuestionsDto) {
    return paginateWithIds({
      qb: this.db.getRepository(Question)
        .createQueryBuilder('question')
        .leftJoin('question.answer', 'answer')
        .where('answer IS NULL')
        .andWhere('question.receiverId = :userId', { userId: user.id })
        .andWhere('question.muted = :muted', { muted: dto.muted || false }),
      paginationDto: dto,
      convertItems: async items => {
        if (dto.markAsSeen) {
          await this.markQuestionsAsSeen(items);
        }

        return await this.sendableService.getSendableQuestions(items, {
          context: user?.entity,
          withUserRelationships: user?.hasRight(EApplicationRight.ReadRelationship),
        });
      },
    });
  }

  async getWaitingQuestionsCounts(user: RequestUserManager) {
    const questions = await this.db.getRepository(Question)
      .createQueryBuilder('question')
      .leftJoin('question.answer', 'answer')
      .where('answer IS NULL')
      .andWhere('question.receiverId = :userId', { userId: user.id })
      .select(['question.id', 'question.muted'])
      .getMany();

    return {
      count: questions.filter(q => !q.muted).length,
      muted: questions.filter(q => q.muted).length,
    };
  }

  private async markQuestionsAsSeen(questions: Question[]) {
    const toMarkAsSeen = questions.filter(q => !q.seen);

    if (!toMarkAsSeen.length) {
      return;
    }

    await this.db.getRepository(Question)
      .update({ id: In(toMarkAsSeen.map(q => q.id)) }, { seen: true });
  }
}
