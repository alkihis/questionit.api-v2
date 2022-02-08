import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import config from '../../shared/config/config';
import { Question } from '../../database/entities/question.entity';

@Injectable()
export class FormatterQuestionService {
  constructor(
    @InjectConnection() private db: Connection,
  ) {}

  getCleanedQuestionText(text: string) {
    const parts = text.split('\n');
    text = parts.slice(0, config.LIMITS.MAX_NEW_LINES_IN_QUESTIONS).join('\n')
      + ' '
      + parts.slice(config.LIMITS.MAX_NEW_LINES_IN_QUESTIONS).join(' ');

    return text
      .replace(/\n+/g, '\n')
      .replace(/\t/g, ' ')
      .trim();
  }

  getTwitterShareableTextOfQuestion(question: Question, appendRocket: boolean) {
    let answerText = question.answer.content;

    if (answerText.length === 0 && question.answer.linkedImage) {
      answerText = '🖼️';
    }
    if (question.poll) {
      answerText = ('📊 ' + answerText).trimEnd();
    }

    const [contentBoundary, answerBoundary] = this.findBestMaximumsForQuestionAndAnswerContent(question.content.length, answerText.length);
    let content = question.content.slice(0, contentBoundary);
    let answer = answerText.slice(0, answerBoundary);

    if (content.length !== question.content.length) {
      // Content is truncated
      content = this.tryToAppendBoundaryToContentText(content);
    }
    if (answer.length !== answerText.length) {
      // Answer is truncated
      answer = this.tryToAppendBoundaryToContentText(answer);
    }

    const text = content + ' – ' + answer;

    const url = config.WEB_URL + '/u/' + question.receiver.slug + '/' + question.id;

    const final = text.trim() + ' ' + url;
    const topPadder = appendRocket ? '🚀 ' : '';

    if (final.length + topPadder.length <= 280) {
      return topPadder + final;
    }
    return final;
  }

  protected findBestMaximumsForQuestionAndAnswerContent(contentLength: number, answerLength: number) {
    const maximumLength = 220;

    // if we don't exceed maximum
    if (contentLength + answerLength <= maximumLength) {
      return [contentLength, answerLength];
    }

    // if both of them exceeds 110 chars
    if (contentLength > (maximumLength / 2) && answerLength > (maximumLength / 2)) {
      return [maximumLength / 2, maximumLength / 2];
    }

    // if one of those is less than 110 chars
    // Here, it's contentLength
    if (contentLength < maximumLength / 2) {
      const max_answer = maximumLength - answerLength;
      return [contentLength, max_answer];
    }
    // Here it's answerLength
    else {
      const max_content = maximumLength - answerLength;
      return [max_content, answerLength];
    }
  }

  protected tryToAppendBoundaryToContentText(content: string) {
    const boundary = '[…]';
    // Maximum search for blank character
    const maxSearchLimit = 10;

    let match: number = -1;
    for (let i = content.length - 1; i > content.length - maxSearchLimit && i >= 0; i--) {
      const currentChar = content[i];

      if (currentChar.match(/\s/)) {
        // empty character, we could end here
        match = i;
        break;
      }
    }

    if (match !== -1) {
      return content.slice(0, match).trimEnd() + ' ' + boundary;
    }

    return content + boundary;
  }
}
