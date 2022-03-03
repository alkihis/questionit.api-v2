import { getEnumValues } from '../../shared/utils/enum.utils';

/**
 * Application allowed rights.
 *
 * For now its stored on 16bits max, template: 0b00000000000000000
 *
 * - To check inside a method, use
 *  `req.user.hasRight(EApplicationRight.{YourCheckedRight})`.
 * - To check for a controller/endpoint,
 *  use `@Right(EApplicationRight.{YourCheckedRight})` as decorator.
 */
export enum EApplicationRight {
  SendQuestion          = 0b00000000000000001,
  AnswerQuestion        = 0b00000000000000010,
  LikeQuestion          = 0b00000000000000100,
  FollowUser            = 0b00000000000001000,
  BlockUser             = 0b00000000000010000,
  ReadTimeline          = 0b00000000000100000,
  DeleteQuestion        = 0b00000000001000000,
  ReadNotification      = 0b00000000010000000,
  DeleteNotification    = 0b00000000100000000,
  ReadWaitingQuestions  = 0b00000001000000000,
  PinQuestions          = 0b00000010000000000,
  ReadRelationship      = 0b00000100000000000,
  ManageBlockedWords    = 0b00001000000000000,
  // Right created to ignore token from external apps. Cannot be obtained by external tokens.
  InternalUseOnly       = 0b00010000000000000,
  // ---
  RefreshToken          = 0b00100000000000000,
}

// All rights
export const INTERNAL_APPLICATION_RIGHT = getEnumValues(EApplicationRight, true)
  .reduce((prev, cur) => prev | cur, 0);
