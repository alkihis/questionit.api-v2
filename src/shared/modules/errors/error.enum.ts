
export enum EApiError {
  // 400 HTTP Errors
  BadRequest = 1,
  MissingParameter,
  InvalidParameter,
  AskedUserMismatch,
  RelationShouldBeBetweenTwoDifferentUsers,
  SlugAlreadyUsed,
  DayQuestionExpired,
  UnsupportedLanguage,
  TooLongQuestion,
  TooLongAnswer,
  NameInvalidCharacters,
  SlugInvalidCharacters,
  InvalidSentFile,
  InvalidSentHeader,
  InvalidSentProfilePicture,
  InvalidPollAnswer,
  TakenPoll,
  NonUniquePoll,
  TokenAlreadyApproved,

  // 401 HTTP Errors
  InvalidExpiredToken = 100,
  TokenMismatch,
  AlreadyAnswered,

  // 403 HTTP Errors
  Forbidden = 200,
  DontAllowAnonymousQuestions,
  AskerUserMismatch,
  InvalidTwitterCredentials,
  InvalidTwitterCallbackKeys,
  CantSendQuestionToYourself,
  TooManyReplies,
  NotAnsweredYet,
  BlockByThisUser,
  OneBlockBetweenUsersExists,
  BannedUser,
  TokenNotAffilated,
  TooManyApplications,
  SameAppName,
  InvalidTokenRights,
  InvalidRole,

  // 404 HTTP Errors
  UserNotFound = 300,
  PageNotFound,
  ResourceNotFound,
  OriginalQuestionNotFound,
  QuestionNotFound,
  PollNotFound,
  ApplicationNotFound,

  // 429
  TooManyRequests = 450,

  // 500 HTTP Errors
  ServerError = 500,
}
