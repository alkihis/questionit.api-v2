import { ISentUser } from './user.interface';

export interface ISentQuestion {
  id: string;
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
  id: string;
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
  id: string;
  options: string[];
}
