import type { ISentUser } from './user.interface';
import type { ISentQuestion } from './question.interface';

export enum ENotificationType {
  Answered = 'answered',
  Question = 'question',
  Follow = 'follow',
  FollowBack = 'follow-back',
}

export interface ISentNotification {
  id: number;
  createdAt: string;
  seen: boolean;
  type: ENotificationType,
  /** Defined if {type} is 'answered' or 'question' */
  question?: ISentQuestion,
  // Si follow: {type} is 'follow' or 'follow-back'.
  user?: ISentUser;
}

export interface INotificationCounts {
  questions: number;
  notifications: number;
}

export type TNotificationContentPayload = INotificationNewFollowerContentPayload | INotificationNewQuestionContentPayload;

export interface INotificationNewFollowerContentPayload {
  id: number;
  user: ISentUser;
}

export interface INotificationNewQuestionContentPayload {
  id: number;
  question: ISentQuestion;
}
