import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection, In } from 'typeorm';
import { User } from '../../../database/entities/user.entity';
import { Question } from '../../../database/entities/question.entity';
import { ISentUser } from '../../../database/interfaces/user.interface';
import { ISentQuestion } from '../../../database/interfaces/question.interface';
import config from '../../config/config';
import { SendableQuestionSharedService } from './sendable.question.shared.service';
import { SendableUserSharedService, TPreloadedUserCounts } from './sendable.user.shared.service';
import { Token } from '../../../database/entities/token.entity';
import { ISentToken } from '../../../database/interfaces/token.interface';
import { SendableRelationshipSharedService, TPreloadedRelationships } from './sendable.relationship.shared.service';
import { Notification } from '../../../database/entities/notification.entity';
import { ISentNotification } from '../../../database/interfaces/notification.interface';
import { QuestionItApplication } from '../../../database/entities/questionit.application.entity';
import { getRightsAsObject } from '../../utils/rights.utils';
import { ISentApplication } from '../../../database/interfaces/questionit.application.interface';
import { DayQuestion, TDayQuestionLanguage } from '../../../database/entities/day.question.entity';

type TPreloadedUserPinnedQuestions = { [userId: number]: ISentQuestion };

export interface IFetchSendableUsers {
  context?: User;
  withPinnedQuestions?: boolean;
  withCounts?: boolean;
  withUserOptions?: boolean;
  withRelationships?: boolean;
}

export interface IFetchSendableQuestion {
  context?: User;
  withUserRelationships?: boolean;
}

export interface IFetchSendableDayQuestion {
  context?: User;
  lang: TDayQuestionLanguage;
}

export interface IFetchSendableNotification {
  context?: User;
}

export enum EImageType {
  Profile,
  Banner,
  Answer,
}

@Injectable()
export class SendableSharedService {
  constructor(
    @InjectConnection() private db: Connection,
    private sendableQuestionService: SendableQuestionSharedService,
    private sendableUserService: SendableUserSharedService,
    private sendableRelationshipService: SendableRelationshipSharedService,
  ) {}

  /* Tokens */

  getSendableTokens(tokens: Token[]): ISentToken[] {
    return tokens.map(token => ({
      id: token.id,
      jti: token.jti,
      createdAt: token.createdAt.toISOString(),
      lastUsedAt: token.lastLoginAt.toISOString(),
      createdWithIp: token.openIp,
    }));
  }

  /* Notifications */

  async getSendableNotifications(notifications: Notification[], options: IFetchSendableNotification = {}) {
    const { users, questions } = await this.preloadQuestionsAndUsersForNotifications(notifications, options);

    const sentNotifications: ISentNotification[] = [];
    const toDelete: number[] = [];

    for (const notification of notifications) {
      const sentNotification: ISentNotification = {
        id: notification.id,
        createdAt: notification.createdAt.toISOString(),
        seen: notification.seen,
        type: notification.type,
      };

      if (notification.type === 'answered' || notification.type === 'question') {
        sentNotification.question = questions.find(q => q.id === notification.relatedTo);

        if (!sentNotification.question) {
          Logger.warn(`Notification ${notification.id} of type ${notification.type}, related to #${notification.relatedTo} is not bound to a question.`);
          toDelete.push(notification.id);

          continue;
        }
      } else {
        sentNotification.user = users.find(q => q.id === notification.relatedTo);

        if (!sentNotification.user) {
          Logger.warn(`Notification ${notification.id} of type ${notification.type}, related to #${notification.relatedTo} is not bound to a user.`);
          toDelete.push(notification.id);

          continue;
        }
      }

      sentNotifications.push(sentNotification);
    }

    if (toDelete.length) {
      await this.db.getRepository(Notification).delete({ id: In(toDelete) });
    }

    return sentNotifications;
  }

  // - Notification Property Preloading -

  private async preloadQuestionsAndUsersForNotifications(notifications: Notification[], options: IFetchSendableNotification) {
    const usersToFetch = notifications.filter(n => n.type === 'follow' || n.type === 'follow-back').map(n => n.relatedTo);
    const questionsToFetch = notifications.filter(n => n.type === 'answered' || n.type === 'question').map(n => n.relatedTo);
    let users: ISentUser[] = [];
    let questions: ISentQuestion[] = [];

    if (usersToFetch.length) {
      users = await this.getSendableUsers(await this.db.getRepository(User).findByIds(usersToFetch), {
        context: options.context,
        withPinnedQuestions: true,
        withCounts: true,
        withRelationships: true,
      });
    }
    if (questionsToFetch.length) {
      questions = await this.getSendableQuestions(await this.db.getRepository(Question).findByIds(questionsToFetch), { context: options.context });
    }

    return { users, questions };
  }

  /* Questions */

  async getSendableQuestionFromDayQuestion(dayQuestion: DayQuestion, options: IFetchSendableDayQuestion): Promise<ISentQuestion> {
    let preloadedUser: ISentUser;

    if (options.context) {
      preloadedUser = await this.getSendableUser(options.context, { context: options.context, withRelationships: true });
    }

    return {
      id: dayQuestion.id,
      owner: null,
      receiver: preloadedUser,
      createdAt: new Date().toISOString(),
      content: dayQuestion.content[options.lang],
      seen: false,
      answer: null,
      inReplyToQuestionId: null,
      questionOfTheDay: true,
      replyCount: 0,
    };
  }

  async getSendableQuestion(question: Question, options: IFetchSendableQuestion = {}) {
    const result = await this.getSendableQuestions([question], options);
    return result[0];
  }

  async getSendableQuestions(questions: Question[], options: IFetchSendableQuestion = {}): Promise<ISentQuestion[]> {
    if (!questions.length) {
      return [];
    }

    // Preload: users, like/reply count, attachments (single request)
    // 1) Attachments
    const polls = await this.sendableQuestionService.preloadPolls(questions.map(q => q.id));
    const answers = await this.sendableQuestionService.preloadAnswers(options.context, questions.map(q => q.id));

    // 2) Users
    const users = await this.preloadQuestionUsers(questions, options);

    // 3) Counts
    const repliesCounts = await this.sendableQuestionService.preloadQuestionsReplyCount(questions.map(q => q.id));

    const sentQuestions: ISentQuestion[] = [];

    for (const question of questions) {
      const sentQuestion: ISentQuestion = {
        id: question.id,
        owner: question.ownerId ? users[question.ownerId] : null,
        receiver: users[question.receiverId],
        createdAt: question.createdAt.toISOString(),
        content: question.content,
        seen: options.context?.id === question.receiverId ? question.seen : null,
        answer: answers[question.id],
        inReplyToQuestionId: question.inReplyToQuestionId?.toString() ?? null,
        questionOfTheDay: !!question.questionOfTheDayId,
        replyCount: repliesCounts[question.id] || 0,
      };

      if (polls[question.id]) {
        sentQuestion.attachements = {
          poll: {
            id: polls[question.id].id,
            options: polls[question.id].options,
          },
        };
      }

      sentQuestions.push(sentQuestion);
    }

    return sentQuestions;
  }

  // - Question Property Preloading -

  private async preloadQuestionUsers(questions: Question[], options: IFetchSendableQuestion) {
    const allUsers = new Set<number>([
      ...questions.map(q => q.ownerId).filter(u => u),
      ...questions.map(q => q.receiverId).filter(u => u),
    ]);

    if (!allUsers.size) {
      return [];
    }

    const users = await this.db.getRepository(User).findByIds([...allUsers]);
    return this.getSendableUsers(users, {
      context: options.context,
      withRelationships: options.withUserRelationships,
    });
  }

  /* Users */

  async getSendableUser(user: User, options: IFetchSendableUsers = {}) {
    const result = await this.getSendableUsers([user], options);
    return result[0];
  }

  async getSendableUsers(users: User[], options: IFetchSendableUsers = {}) {
    if (!users.length) {
      return [];
    }

    // Preload questions, question/following/follower counts, relationship statuses
    let preloadedRelationships: TPreloadedRelationships | undefined;
    let preloadedCounts: TPreloadedUserCounts | undefined;
    let preloadedQuestions: TPreloadedUserPinnedQuestions | undefined;

    if (options.withCounts) {
      preloadedCounts = await this.sendableUserService.preloadCountsForUsers(users);
    }
    if (options.withRelationships && options.context) {
      preloadedRelationships = await this.sendableRelationshipService.bulkRelationships(options.context, users);
    }
    if (options.withPinnedQuestions) {
      preloadedQuestions = await this.preloadPinnedQuestions(options.context, users);
    }

    const sentUsers: ISentUser[] = [];

    for (const user of users) {
      const sentUser: ISentUser = {
        id: user.id,
        createdAt: user.createdAt.toISOString(),
        name: user.name,
        slug: user.slug,
        twitterId: user.twitterId,
        profileAskMeMessage: user.askMeMessage,
        profilePictureUrl: this.processImageLink(user.profilePicture, EImageType.Profile),
        bannerPictureUrl: this.processImageLink(user.bannerPicture, EImageType.Banner),
        allowAnonymousQuestions: user.allowAnonymousQuestions,
      };

      if (preloadedQuestions) {
        sentUser.pinnedQuestion = preloadedQuestions[user.id];
      }
      if (preloadedRelationships) {
        sentUser.relationship = preloadedRelationships[user.id];
      }
      if (preloadedCounts) {
        sentUser.counts = preloadedCounts[user.id];
      }
      if (options.withUserOptions) {
        sentUser.sendQuestionsToTwitterByDefault = user.sendQuestionsToTwitterByDefault;
        sentUser.visible = user.visible;
        sentUser.allowQuestionOfTheDay = user.allowQuestionOfTheDay;
        sentUser.dropQuestionsOnBlockedWord = user.dropQuestionsOnBlockedWord;
        sentUser.safeMode = user.safeMode;
      }

      sentUsers.push(sentUser);
    }

    return sentUsers;
  }

  // - User Property Preloading -

  private async preloadPinnedQuestions(sourceUser: User | undefined, users: User[]) {
    const pinnedQuestionIds = users.filter(u => u.pinnedQuestionId).map(u => u.pinnedQuestionId);

    if (!pinnedQuestionIds.length) {
      return {};
    }

    const questions = await this.getSendableQuestions(
      await this.db.getRepository(Question).findByIds(pinnedQuestionIds),
      {
        context: sourceUser,
      },
    );

    const pinnedQuestionMap: TPreloadedUserPinnedQuestions = {};

    for (const user of users) {
      if (user.pinnedQuestionId) {
        pinnedQuestionMap[user.id] = questions.find(q => q.id === user.pinnedQuestionId) || null;
      } else {
        pinnedQuestionMap[user.id] = null;
      }
    }

    return pinnedQuestionMap;
  }

  /* Applications */

  getSendableApplications(applications: QuestionItApplication[]): ISentApplication[] {
    return applications.map(app => this.getSendableApplication(app));
  }

  getSendableApplication(application: QuestionItApplication): ISentApplication {
    return {
      id: application.id,
      name: application.name,
      key: application.key,
      rights: getRightsAsObject(Number(application.defaultRights)),
      url: application.url,
    };
  }

  getSendableApplicationFromToken(token: Token): ISentApplication {
    return {
      id: token.application.id,
      name: token.application.name,
      key: token.application.key,
      rights: getRightsAsObject(Number(token.rights)),
      url: token.application.url,
    };
  }

  /* Assets */

  private processImageLink(url: string | undefined, type: EImageType) {
    if (!url) {
      return null;
    }

    if (type === EImageType.Profile) {
      return config.URL + '/user/profile/' + url;
    } else if (type === EImageType.Banner) {
      return config.URL + '/user/banner/' + url;
    } else if (type === EImageType.Answer) {
      return config.URL + '/question/answer/media/' + url;
    }
    return null;
  }
}
