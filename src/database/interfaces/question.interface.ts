import { ISentUser } from './user.interface';

export interface ISentQuestion {
  id: number;
  // null if owner made question in anonymous mode
  owner: ISentUser | null;
  receiver: ISentUser;
  createdAt: string;
  content: string;
  seen: boolean | null;
  answer: ISentAnswer | null;
  inReplyToQuestionId: string | null;
  questionOfTheDay: boolean;
  replyCount: number;
  attachements?: SentQuestionAttachements;
}

export interface ISentAnswer {
  id: number;
  content: string;
  createdAt: string;
  liked: boolean;
  likeCount: number;
  attachment?: ISentAnswerAttachment;
}

export interface ISentAnswerAttachment {
  url: string;
  type: 'image' | 'gif';
}

export interface SentQuestionAttachements {
  poll?: ISentPoll;
}

export interface ISentPoll {
  id: number;
  options: string[];
}
