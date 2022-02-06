import { EApplicationRight } from '../../database/enums/questionit.application.enum';
import { TPossibleRight, TRightsObject } from '../../database/interfaces/questionit.application.interface';

export function getRightsAsObject(rights: number): TRightsObject {
  const dto: { [K in TPossibleRight]: boolean | number } = {
    sendQuestion: rights & EApplicationRight.SendQuestion,
    answerQuestion: rights & EApplicationRight.AnswerQuestion,
    likeQuestion: rights & EApplicationRight.LikeQuestion,
    followUser: rights & EApplicationRight.FollowUser,
    blockUser: rights & EApplicationRight.BlockUser,
    readTimeline: rights & EApplicationRight.ReadTimeline,
    deleteQuestion: rights & EApplicationRight.DeleteQuestion,
    readNotification: rights & EApplicationRight.ReadNotification,
    deleteNotification: rights & EApplicationRight.DeleteNotification,
    readWaitingQuestion: rights & EApplicationRight.ReadWaitingQuestions,
    pinQuestion: rights & EApplicationRight.PinQuestions,
    readRelationship: rights & EApplicationRight.ReadRelationship,
    manageBlockedWords: rights & EApplicationRight.ManageBlockedWords,
  };

  for (const item in dto) {
    dto[item] = Boolean(dto[item]);
  }

  return dto as TRightsObject;
}
