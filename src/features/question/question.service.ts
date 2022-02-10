import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection, In } from 'typeorm';
import { RequestUserManager } from '../../shared/managers/request.user.manager';
import { AnswerQuestionDto, GetQuestionAncestorsDto, GetQuestionOfUserDto, GetQuestionRepliesDto, GetQuestionTimelineDto, GetWaitingQuestionsDto, MakeQuestionDto } from './question.dto';
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
import { ISentQuestion, ISentQuestionTree } from '../../database/interfaces/question.interface';
import { NotificationSharedService } from '../../shared/modules/notifications/notification.shared.service';
import { ENotificationType, INotificationNewQuestionContentPayload } from '../../database/interfaces/notification.interface';
import { paginateWithIds } from '../../shared/utils/pagination/pagination.utils';
import { Answer } from '../../database/entities/answer.entity';
import { EApplicationRight } from '../../database/enums/questionit.application.enum';
import { SendableRelationshipSharedService } from '../../shared/modules/sendable/sendable.relationship.shared.service';
import { Notification } from '../../database/entities/notification.entity';
import { escapeRegExp } from '../../shared/utils/regex.utils';
import { DayQuestionService } from './day.question.service';
import { MediasService } from '../../shared/modules/medias/medias.service';
import { FormatterQuestionService } from './formatter.question.service';
import { TwitterService } from '../../shared/modules/twitter/twitter.service';
import { SendTweetV1Params, TwitterApi } from 'twitter-api-v2';

interface ICreateQuestionFromDtoArgs {
  user: RequestUserManager | undefined;
  targetUser: User;
  dto: MakeQuestionDto;
  emitterIp: string;
  asAnonymous: boolean;
}

export type TUploadAnswerPicture = { picture: Express.Multer.File[] };

interface IAnswerToQuestionParams {
  user: RequestUserManager;
  questionId: number;
  dto: AnswerQuestionDto;
  files: TUploadAnswerPicture;
}

type TAnswerLinkResult = { link: string, mimeType: string };

interface IAnswerToTwitterParams {
  user: RequestUserManager;
  question: Question;
  linkedImage: TAnswerLinkResult;
  originalFiles: TUploadAnswerPicture;
}

@Injectable()
export class QuestionService {
  constructor(
    @InjectConnection() private db: Connection,
    private dayQuestionService: DayQuestionService,
    private formatterQuestionService: FormatterQuestionService,
    private sendableService: SendableSharedService,
    private blockService: BlockSharedService,
    private notificationService: NotificationSharedService,
    private sendableRelationshipService: SendableRelationshipSharedService,
    private mediasService: MediasService,
    private twitterService: TwitterService,
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
    const content = this.formatterQuestionService.getCleanedQuestionText(dto.content);

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
        .andWhere('poll.id = :pollId', { pollId: dto.pollId || -1 })
        .getOneOrFail(),
      EApiError.TakenPoll,
    );
  }

  /** Question reading */

  async listQuestionsReceivedByUser(user: RequestUserManager | undefined, userId: number, dto: GetQuestionOfUserDto) {
    await ErrorService.fulfillOrHttpException(
      this.db.getRepository(User).findOneOrFail({ where: { id: userId || -1 } }),
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

  /** Question ancestors reading */

  async getQuestionAndAncestors(user: RequestUserManager | undefined, questionId: number, dto: GetQuestionAncestorsDto): Promise<ISentQuestionTree> {
    const question = await ErrorService.fulfillOrHttpException(
      this.db.getRepository(Question)
        .createQueryBuilder('question')
        .leftJoin('question.answer', 'answer')
        .where('question.id = :questionId', { questionId })
        .andWhere('(answer IS NOT NULL OR question.receiverId = :receiverId)', { receiverId: user?.id })
        .getOneOrFail(),
      EApiError.QuestionNotFound,
    );

    const conversationLength = await this.getFullConversationLength(user, question);
    const ancestors = await this.getQuestionAncestorsOf(question, dto.pageSize);

    // .getSendableQuestions ensure original question order is preserved
    const [sentQuestion, ...ancestorsSentQuestions] = await this.sendableService.getSendableQuestions([question, ...ancestors], {
      context: user?.entity,
      withUserRelationships: user?.hasRight(EApplicationRight.ReadRelationship),
    });

    return {
      length: conversationLength,
      question: sentQuestion,
      ancestors: ancestorsSentQuestions,
    };
  }

  private async getFullConversationLength(user: RequestUserManager | undefined, question: Question) {
    return await this.db.getRepository(Question)
      .createQueryBuilder('question')
      .leftJoin('question.answer', 'answer')
      .where('question.conversationId = :conversationId', { conversationId: question.conversationId })
      .andWhere('(answer IS NOT NULL OR question.receiverId = :receiverId)', { receiverId: user?.id })
      .getCount();
  }

  private async getQuestionAncestorsOf(question: Question, maxDepth: number) {
    if (maxDepth > 50) {
      throw ErrorService.throw(EApiError.BadRequest);
    }

    // Don't load the full question entities to avoid possible massive load
    const possibleParents = await this.db.getRepository(Question)
      .createQueryBuilder('question')
      .innerJoin('question.answer', 'answer')
      .where('question.conversationId = :conversationId', { conversationId: question.conversationId })
      .andWhere('question.id < :questionId', { questionId: question.id })
      .select(['question.id', 'question.inReplyToQuestionId'])
      .getMany();

    const questionTreeById: number[] = [];
    let currentInReplyToId = question.inReplyToQuestionId;

    // Compute the list of ancestor IDs
    while (maxDepth > 0 && currentInReplyToId) {
      const parentQuestion = possibleParents.find(q => q.id === currentInReplyToId);

      if (parentQuestion) {
        questionTreeById.push(parentQuestion.id);
      }

      currentInReplyToId = parentQuestion?.inReplyToQuestionId;
      maxDepth--;
    }

    // Reverse question to have first ancestor on the beginning
    // They are correctly sorted after that :)
    const ancestorIdsInTheRightOrder = questionTreeById.reverse();

    if (!ancestorIdsInTheRightOrder.length) {
      return []
    }

    // Load the full question entites
    const questionEntities = await this.db.getRepository(Question).findByIds(ancestorIdsInTheRightOrder);

    return ancestorIdsInTheRightOrder.map(questionId => questionEntities.find(q => q.id === questionId));
  }

  /** Question replies reading */

  async getRepliesOfQuestion(user: RequestUserManager | undefined, questionId: number, dto: GetQuestionRepliesDto) {
    return paginateWithIds({
      qb: this.db.getRepository(Answer)
        .createQueryBuilder('answer')
        .innerJoinAndSelect('answer.question', 'question')
        .where('question.inReplyToQuestionId = :questionId', { questionId }),
      paginationDto: dto,
      convertItems: items => this.sendableService.getSendableQuestions(
        items.map(item => item.question),
        { context: user?.entity, withUserRelationships: user?.hasRight(EApplicationRight.ReadRelationship) },
      ),
    });
  }

  /** Question timeline reading */

  async getQuestionTimelineOfUser(user: RequestUserManager, dto: GetQuestionTimelineDto) {
    const followingsOfUser = await this.sendableRelationshipService.followingsOf(user.entity);

    return paginateWithIds({
      qb: this.db.getRepository(Answer)
        .createQueryBuilder('answer')
        .innerJoinAndSelect('answer.question', 'question')
        .where('question.receiverId IN (:...followingsIds)', { followingsIds: followingsOfUser.length ? followingsOfUser : [-1] }),
      paginationDto: dto,
      convertItems: items => this.sendableService.getSendableQuestions(
        items.map(item => item.question),
        { context: user?.entity, withUserRelationships: user?.hasRight(EApplicationRight.ReadRelationship) },
      ),
    });
  }

  /** Question pinning */

  async pinQuestionToProfile(user: RequestUserManager, questionId: number) {
    const question = await ErrorService.fulfillOrHttpException(
      this.db.getRepository(Question)
        .createQueryBuilder('question')
        .innerJoin('question.answer', 'answer')
        .where('question.id = :questionId', { questionId })
        .andWhere('question.receiverId = :userId', { userId: user.id })
        .getOneOrFail(),
      EApiError.QuestionNotFound,
    );

    user.entity.pinnedQuestionId = question.id;
    await this.db.getRepository(User).save(user.entity);

    return this.sendableService.getSendableUser(user.entity, {
      context: user.entity,
      withCounts: true,
      withPinnedQuestions: true,
      withUserOptions: true,
      withRelationships: user.hasRight(EApplicationRight.ReadRelationship),
    });
  }

  async unpinQuestionOfProfile(user: RequestUserManager) {
    user.entity.pinnedQuestionId = null;
    await this.db.getRepository(User).save(user.entity);

    return this.sendableService.getSendableUser(user.entity, {
      context: user.entity,
      withCounts: true,
      withPinnedQuestions: true,
      withUserOptions: true,
      withRelationships: user.hasRight(EApplicationRight.ReadRelationship),
    });
  }

  /** Question delete */

  async deleteQuestion(user: RequestUserManager, questionId: number) {
    const question = await ErrorService.fulfillOrHttpException(
      this.db.getRepository(Question)
        .createQueryBuilder('question')
        .where('question.id = :questionId', { questionId })
        .andWhere('question.receiverId = :userId', { userId: user.id })
        .getOneOrFail(),
      EApiError.QuestionNotFound,
    );

    // Delete possible notifications of question/answer
    await this.db.getRepository(Notification)
      .createQueryBuilder()
      .delete()
      .where('type IN (:...questionNotificationTypes)', { questionNotificationTypes: [ENotificationType.Question, ENotificationType.Answered] })
      .andWhere('relatedTo = :questionId', { questionId: question.id })
      .execute();

    await this.db.getRepository(Question).delete({ id: question.id });
  }

  async deleteAllPendingMutedQuestions(user: RequestUserManager) {
    const pendingQuestions = await this.db.getRepository(Question)
      .createQueryBuilder('question')
      .leftJoin('question.answer', 'answer')
      .leftJoinAndSelect('question.poll', 'poll')
      .where('question.receiverId = :userId', { userId: user.id })
      .andWhere('answer IS NULL')
      .getMany();

    const questionsBlockedWords = this.getQuestionsWithBlockedWords(user, pendingQuestions);
    if (!questionsBlockedWords.length) {
      return;
    }

    const questionIds = questionsBlockedWords.map(q => q.id);

    await this.db.getRepository(Notification)
      .createQueryBuilder()
      .delete()
      .where('type IN (:...questionNotificationTypes)', { questionNotificationTypes: [ENotificationType.Question, ENotificationType.Answered] })
      .andWhere('relatedTo IN (:...questionIds)', { questionIds })
      .execute();

    await this.db.getRepository(Question).delete({ id: In(questionIds) });

    return { count: questionsBlockedWords.length };
  }

  private getQuestionsWithBlockedWords(user: RequestUserManager, questions: Question[]) {
    if (!user.entity.blockedWords?.length) {
      return [];
    }

    const checker = new RegExp('\\b(' + user.entity.blockedWords.map(escapeRegExp).join('|') + ')\\b', 'i');

    // Return array of questions that match blocked words
    return questions.filter(question => {
      const items = question.poll ? [question.content, ...question.poll.options] : [question.content];

      // true if at least one item is considered as blocked
      return items.some(item => checker.test(item));
    });
  }

  /** Question delete */

  async answerToQuestion({ user, questionId, dto, files }: IAnswerToQuestionParams) {
    const question = await this.getConcernedQuestionForAnswer(user, questionId, dto);

    const answerText = this.getAnswerTextFromDto(question, dto, files);
    const linkedImage = await this.getAnswerImageLinkFromDto(answerText, files);

    question.seen = true;
    if (question.id) {
      // Not a new day question
      question.updatedAt = new Date();
    }

    await this.db.getRepository(Question).save(question);

    // Ok, question always has an ID now

    const answer = this.db.getRepository(Answer).create({
      questionId: question.id,
      content: answerText,
      linkedImage: linkedImage?.link || null,
      ownerId: user.id,
    });

    await this.db.getRepository(Answer).save(answer);

    question.answer = answer;

    this.notifySenderForQuestionReply(question)
      .catch(err => Logger.error('Unable to sent reply notification:', err));

    // If {receiver} answer, we can delete its notification associated with awaiting question
    await this.db.getRepository(Notification)
      .delete({ userId: user.id, relatedTo: question.id, type: ENotificationType.Question });

    this.sendAnswerToTwitter({ user, question, linkedImage, originalFiles: files })
      .catch(err => Logger.error(`Unable to sent tweet for question ${question.id}:`, err));

    return await this.sendableService.getSendableQuestion(question, {
      context: user.entity,
      withUserRelationships: user.hasRight(EApplicationRight.ReadRelationship),
    });
  }

  private async getConcernedQuestionForAnswer(user: RequestUserManager, questionId: number, dto: AnswerQuestionDto) {
    if (dto.isQuestionOfTheDay) {
      return await this.dayQuestionService.getQuestionEntityForQuestionOfTheDay(user, dto.dayQuestionLanguage, questionId);
    }

    return await ErrorService.fulfillOrHttpException(
      this.db.getRepository(Question)
        .createQueryBuilder('question')
        .leftJoin('question.answer', 'answer')
        .leftJoinAndSelect('question.poll', 'poll')
        .leftJoinAndSelect('question.inReplyToQuestion', 'inreplyto')
        .where('question.id = :questionId', { questionId })
        .andWhere('question.receiverId = :userId', { userId: user.id })
        .andWhere('answer IS NULL')
        .getOneOrFail(),
      EApiError.QuestionNotFound,
    );
  }

  private getAnswerTextFromDto(question: Question, dto: AnswerQuestionDto, files: TUploadAnswerPicture) {
    // Answer to :question
    let answerText = dto.answer.trim();

    if (question.poll) {
      // If the response is not inside the attached poll
      const replied = question.poll.options.find(e => e.normalize() === answerText.normalize());

      if (replied === undefined) {
        throw ErrorService.throw(EApiError.InvalidPollAnswer);
      }
      // If we try to answer with an image
      if (files?.picture?.length) {
        throw ErrorService.create(EApiError.InvalidPollAnswer);
      }

      answerText = replied;
    }

    return answerText ? this.formatterQuestionService.getCleanedQuestionText(answerText) : '';
  }

  private async getAnswerImageLinkFromDto(answerText: string, files: TUploadAnswerPicture): Promise<TAnswerLinkResult> {
    if (files?.picture?.length) {
      const { link, mimeType } = await this.mediasService.getConvertedImageFile({
        file: files.picture[0],
        mimeTypeCheck: type => type.mime === 'image/jpeg' || type.mime === 'image/png' || type.mime === 'image/gif',
        fileSizeCheck: (size, type) => type.mime === 'image/gif'
          ? size <= config.LIMITS.ANSWER_GIF_FILE_SIZE
          : size <= config.LIMITS.ANSWER_PICTURE_FILE_SIZE,
        destination: config.UPLOAD.ANSWER_PICTURES,
        dimensions: { couldResize: true },
      });

      return { link, mimeType };
    } else if (!answerText) {
      throw ErrorService.throw(EApiError.MissingParameter);
    }

    return null;
  }

  private async notifySenderForQuestionReply(question: Question) {
    // Question is sent from anonymous user.
    // Notification for question reply cannot be made in those conditions.
    if (!question.privateOwnerId) {
      return;
    }

    const targetUser = await this.db.getRepository(User)
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.pushSubscriptions', 'subscriptions')
      .where('user.id = :userId', { userId: question.privateOwnerId })
      .getOne();

    const notification = await this.notificationService.makeNotification({
      targetUserId: targetUser.id,
      type: ENotificationType.Answered,
      relatedToId: question.id,
    });

    const sentQuestion = await this.sendableService.getSendableQuestion(question, {
      context: targetUser,
      withUserRelationships: true,
    });
    const pushNotificationContent: INotificationNewQuestionContentPayload = {
      id: notification.id,
      question: sentQuestion,
    };

    await this.notificationService.pushNotification(targetUser.pushSubscriptions, pushNotificationContent);
  }

  private async sendAnswerToTwitter({ user, question, linkedImage, originalFiles }: IAnswerToTwitterParams) {
    const client = this.twitterService.getClientForUser(user.entity);
    let mediaId: string = undefined;

    if (linkedImage) {
      const mimeType = linkedImage.mimeType;
      const imagePathToUpload = mimeType === 'image/gif'
        ? originalFiles.picture[0].path
        : (config.UPLOAD.ANSWER_PICTURES + '/' + linkedImage.link);

      try {
        mediaId = await client.v1.uploadMedia(imagePathToUpload, {
          type: mimeType,
        });
      } catch (e) {
        Logger.error(`Unable to send file ${imagePathToUpload} to Twitter for question ${question.id}:`, e);
      }
    }

    const tweet = await this.tryToSendTwitterStatusFromTextAndParams(user, question, mediaId);

    if (tweet) {
      await this.db.getRepository(Question)
        .update({ id: question.id }, { tweetId: tweet.id_str });
    }
  }

  private async tryToSendTwitterStatusFromTextAndParams(user: RequestUserManager, question: Question, mediaId?: string) {
    const client = this.twitterService.getClientForUser(user.entity);
    const statusText = this.formatterQuestionService.getTwitterShareableTextOfQuestion(question, user.entity.useRocketEmojiInQuestions);

    try {
      return await client.v1.tweet(statusText, {
        auto_populate_reply_metadata: true,
        in_reply_to_status_id: question.inReplyToQuestion?.tweetId ?? undefined,
        media_ids: mediaId ? [mediaId] : undefined,
      });
    } catch (e) {
      Logger.error(`Unable to send Twitter status to Twitter: ${statusText}.`, e);
    }

    if (question.inReplyToQuestion?.tweetId) {
      // Original status may be delete, that may cause the failure. Retry without considering reply mode
      try {
        return await client.v1.tweet(statusText, { media_ids: mediaId ? [mediaId] : undefined });
      } catch (e) {
        Logger.error(`Unable to send Twitter status to Twitter: ${statusText}.`, e);
      }
    }

    return null;
  }
}
