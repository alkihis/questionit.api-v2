import { EApiError } from './error.enum';
import { HttpException, HttpStatus } from '@nestjs/common';
import config from '../../config/config';

type TErrorObject = {
  [K in EApiError]: [number, string];
};

export interface IErrorContent {
  statusCode: number;
  code: EApiError;
  message: string;
  [K: string]: any;
}

export class ErrorService {
  protected static errorMessageBindings: TErrorObject = {
    [EApiError.BadRequest]: [HttpStatus.BAD_REQUEST, 'Request is invalid.'],
    [EApiError.MissingParameter]: [HttpStatus.BAD_REQUEST, 'A parameter in request is invalid.'],
    [EApiError.InvalidParameter]: [HttpStatus.BAD_REQUEST, 'A parameter in request is not well-formatted.'],
    [EApiError.AskedUserMismatch]: [HttpStatus.BAD_REQUEST, 'The question which you want to reply to does not belongs to the targeted user.'],
    [EApiError.SlugAlreadyUsed]: [HttpStatus.BAD_REQUEST, 'This slug is already is use.'],
    [EApiError.RelationShouldBeBetweenTwoDifferentUsers]: [HttpStatus.BAD_REQUEST, 'A relation should be with two different users.'],
    [EApiError.DayQuestionExpired]: [HttpStatus.BAD_REQUEST, 'This question of the day isn\'t valid anymore.'],
    [EApiError.UnsupportedLanguage]: [HttpStatus.BAD_REQUEST, 'This language is currently not supported for question of the day.'],
    [EApiError.NameInvalidCharacters]: [HttpStatus.BAD_REQUEST, 'Name contains invalid characters.'],
    [EApiError.SlugInvalidCharacters]: [HttpStatus.BAD_REQUEST, 'Slug contains invalid characters.'],
    [EApiError.TooLongQuestion]: [HttpStatus.BAD_REQUEST, 'Max question length is ' + config.LIMITS.QUESTION_LENGTH + '.'],
    [EApiError.TooLongAnswer]: [HttpStatus.BAD_REQUEST, 'Max answer length is ' + config.LIMITS.ANSWER_LENGTH + '.'],
    [EApiError.InvalidSentFile]: [HttpStatus.BAD_REQUEST, 'Sent file is invalid or does not respect MIME type check.'],
    [EApiError.InvalidSentHeader]: [HttpStatus.BAD_REQUEST, 'Sent header banner is invalid.'],
    [EApiError.InvalidSentProfilePicture]: [HttpStatus.BAD_REQUEST, 'Sent profile picture is invalid.'],
    [EApiError.InvalidPollAnswer]: [HttpStatus.BAD_REQUEST, 'You must reply with a poll valid response.'],
    [EApiError.TakenPoll]: [HttpStatus.BAD_REQUEST, 'This poll is already linked to a question.'],
    [EApiError.NonUniquePoll]: [HttpStatus.BAD_REQUEST, 'You can\'t have duplicated items in a poll.'],
    [EApiError.TokenAlreadyApproved]: [HttpStatus.BAD_REQUEST, 'This token has already been approved.'],
    [EApiError.InvalidExpiredToken]: [HttpStatus.UNAUTHORIZED, 'Invalid or expired token.'],
    [EApiError.TokenMismatch]: [HttpStatus.UNAUTHORIZED, 'Token does not exists or does not belongs to you.'],
    [EApiError.AlreadyAnswered]: [HttpStatus.UNAUTHORIZED, 'This question is already answered.'],
    [EApiError.Forbidden]: [HttpStatus.FORBIDDEN, 'You do not have the right to do that.'],
    [EApiError.DontAllowAnonymousQuestions]: [HttpStatus.FORBIDDEN, 'This user do not accept anonymous questions.'],
    [EApiError.AskerUserMismatch]: [HttpStatus.FORBIDDEN, 'The user that can ask for a reply must be the same user that asked the original question.'],
    [EApiError.InvalidTwitterCredentials]: [HttpStatus.FORBIDDEN, 'Registered Twitter credentials are now invalid. Please login again with Twitter Sign-In flow.'],
    [EApiError.InvalidTwitterCallbackKeys]: [HttpStatus.FORBIDDEN, 'Twitter keys used to request access token are invalid. Retry the login flow.'],
    [EApiError.CantSendQuestionToYourself]: [HttpStatus.FORBIDDEN, 'You cannot send a question to yourself. Use anonymous send instead.'],
    [EApiError.NotAnsweredYet]: [HttpStatus.FORBIDDEN, 'This question has not beed answered yet.'],
    [EApiError.TooManyReplies]: [HttpStatus.FORBIDDEN, 'This question already have enough replies.'],
    [EApiError.BlockByThisUser]: [HttpStatus.FORBIDDEN, 'You are blocked by this user.'],
    [EApiError.OneBlockBetweenUsersExists]: [HttpStatus.FORBIDDEN, 'One block exists between you and the target user, so you cannot send questions.'],
    [EApiError.BannedUser]: [HttpStatus.FORBIDDEN, 'Your account can\'t do actions right now.'],
    [EApiError.TokenNotAffilated]: [HttpStatus.FORBIDDEN, 'This token has not been approved yet.'],
    [EApiError.TooManyApplications]: [HttpStatus.FORBIDDEN, 'You already have too many applications.'],
    [EApiError.SameAppName]: [HttpStatus.FORBIDDEN, 'You can\'t create multiple apps with the same name.'],
    [EApiError.InvalidTokenRights]: [HttpStatus.FORBIDDEN, 'Your credentials doesn\'t allow you to access this resource.'],
    [EApiError.InvalidRole]: [HttpStatus.FORBIDDEN, 'Your account doesn\'t allow you to access this resource.'],
    [EApiError.UserNotFound]: [HttpStatus.NOT_FOUND, 'User does not exists.'],
    [EApiError.PageNotFound]: [HttpStatus.NOT_FOUND, 'This page does not exists.'],
    [EApiError.ResourceNotFound]: [HttpStatus.NOT_FOUND, 'This resource does not exists.'],
    [EApiError.OriginalQuestionNotFound]: [HttpStatus.NOT_FOUND, 'You can not reply to a question that does not exists.'],
    [EApiError.QuestionNotFound]: [HttpStatus.NOT_FOUND, 'Question does not exists.'],
    [EApiError.PollNotFound]: [HttpStatus.NOT_FOUND, 'This poll does not exists.'],
    [EApiError.ApplicationNotFound]: [HttpStatus.NOT_FOUND, 'Key is invalid or expired.'],
    [EApiError.TooManyRequests]: [HttpStatus.TOO_MANY_REQUESTS, 'You exceed the rate-limit. Please try again later.'],
    [EApiError.ServerError]: [HttpStatus.INTERNAL_SERVER_ERROR, 'Server error. Please retry again later.'],
  };

  static create(error: EApiError, additionnal?: object): HttpException {
    const content = this.makeContent(error, additionnal);

    return new HttpException(content, content.statusCode);
  }

  static makeContent(error: EApiError, additionnal?: any): IErrorContent {
    if (error in this.errorMessageBindings) {
      const obj = this.errorMessageBindings[error];

      return {
        statusCode: obj[0],
        code: error,
        message: obj[1],
        ...(additionnal ?? {}),
      };
    }

    return this.makeContent(EApiError.ServerError);
  }

  static throw(error: EApiError, additionnal?: any): never {
    throw this.create(error, additionnal);
  }

  static async fulfillOrHttpException<T>(promise: T, error: ((e: any) => never) | EApiError) {
    try {
      return await promise;
    } catch (e) {
      if (typeof error === 'function') {
        error(e);
      } else {
        throw ErrorService.throw(e);
      }
    }
  }
}
