import { EApplicationRight } from '../../database/enums/questionit.application.enum';
import { TPossibleRight, TRightsObject } from '../../database/interfaces/questionit.application.interface';
import { ApplicationRightsDto } from '../../features/application/application.dto';

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

export function getRightsFromBody(dto: ApplicationRightsDto, initialRights = 0) {
  const matchers: [boolean | undefined, EApplicationRight][] = [
    [dto.sendQuestion, EApplicationRight.SendQuestion],
    [dto.answerQuestion, EApplicationRight.AnswerQuestion],
    [dto.likeQuestion, EApplicationRight.LikeQuestion],
    [dto.followUser, EApplicationRight.FollowUser],
    [dto.blockUser, EApplicationRight.BlockUser],
    [dto.readTimeline, EApplicationRight.ReadTimeline],
    [dto.deleteQuestion, EApplicationRight.DeleteQuestion],
    [dto.readNotification, EApplicationRight.ReadNotification],
    [dto.deleteNotification, EApplicationRight.DeleteNotification],
    [dto.readWaitingQuestion, EApplicationRight.ReadWaitingQuestions],
    [dto.pinQuestion, EApplicationRight.PinQuestions],
    [dto.readRelationship, EApplicationRight.ReadRelationship],
    [dto.manageBlockedWords, EApplicationRight.ManageBlockedWords],
  ];

  let rights = initialRights;

  for (const [isRightEnabled, right] of matchers) {
    if (isRightEnabled) {
      // We want this item
      rights |= right;
    }
    else if (isRightEnabled === false && (rights & right)) {
      // We don't want this item (it isn't undefined), and its activated, so we disable it
      rights ^= right;
    }
  }

  return rights;
}
