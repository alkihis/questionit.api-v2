import { User } from './user.entity';
import { Token } from './token.entity';
import { Relationship } from './relationship.entity';
import { QuestionItApplication } from './questionit.application.entity';
import { ApplicationToken } from './application.token.entity';
import { Block } from './block.entity';
import { Like } from './like.entity';
import { Notification } from './notification.entity';
import { Poll } from './poll.entity';
import { PushMessage } from './push.message.entity';
import { Answer } from './answer.entity';
import { Question } from './question.entity';
import { DayQuestion } from './day.question.entity';

export const ENTITIES = [
  User,
  Token,
  Relationship,
  QuestionItApplication,
  ApplicationToken,
  Block,
  Like,
  Notification,
  Poll,
  PushMessage,
  Answer,
  Question,
  DayQuestion,
] as const;
