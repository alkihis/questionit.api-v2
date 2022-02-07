import { ISentRelationship } from './relationship.interface';
import { ISentQuestion } from './question.interface';

export interface ISentUser {
  id: number;
  name: string;
  slug: string;
  twitterId: string;
  profileAskMeMessage: string;
  createdAt: string;
  profilePictureUrl: string | null;
  bannerPictureUrl: string | null;
  allowAnonymousQuestions: boolean;

  // Advanced infos
  relationship?: ISentRelationship;
  pinnedQuestion?: ISentQuestion | null;
  counts?: ISentUserCounts;
  // Limited to self
  sendQuestionsToTwitterByDefault?: boolean | null;
  visible?: boolean;
  allowQuestionOfTheDay?: boolean | null;
  dropQuestionsOnBlockedWord?: boolean;
  safeMode?: boolean;
}

export interface ISentUserCounts {
  answers: number;
  followers: number;
  followings: number;
}
