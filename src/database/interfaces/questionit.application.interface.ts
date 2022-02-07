export interface ISentApplication extends ISentRegistredApplication {
  key: string;
}

export interface ISentRegistredApplication {
  name: string;
  id: number;
  url: string;
  rights: { [rightName: string]: boolean };
}

export type TPossibleRight = 'sendQuestion' | 'answerQuestion' | 'likeQuestion'
  | 'followUser' | 'blockUser' | 'readTimeline' | 'deleteQuestion' | 'readNotification'
  | 'deleteNotification' | 'readWaitingQuestion' | 'pinQuestion' | 'readRelationship'
  | 'manageBlockedWords';

export type TRightsObject = {
  [K in TPossibleRight]: boolean;
};
