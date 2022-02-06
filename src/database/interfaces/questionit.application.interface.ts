export interface SentApplication extends SentRegistredApplication {
  key: string;
}

export interface SentRegistredApplication {
  name: string;
  id: string;
  url: string;
  rights: { [rightName: string]: string };
}

export type TPossibleRight = 'sendQuestion' | 'answerQuestion' | 'likeQuestion'
  | 'followUser' | 'blockUser' | 'readTimeline' | 'deleteQuestion' | 'readNotification'
  | 'deleteNotification' | 'readWaitingQuestion' | 'pinQuestion' | 'readRelationship'
  | 'manageBlockedWords';

export type TRightsObject = {
  [K in TPossibleRight]: boolean;
};
