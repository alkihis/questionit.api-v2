import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { User } from '../../../database/entities/user.entity';
import { Question } from '../../../database/entities/question.entity';
import { Answer } from '../../../database/entities/answer.entity';
import { ISentAnswer } from '../../../database/interfaces/question.interface';
import { Like } from '../../../database/entities/like.entity';
import { Poll } from '../../../database/entities/poll.entity';
import { MediasService } from '../medias/medias.service';
import { EImageType } from './sendable.shared.service';

export type TPreloadedPollsOfQuestions = { [questionId: number]: Poll };
export type TPreloadedAnswersOfQuestions = { [questionId: number]: ISentAnswer };

@Injectable()
export class SendableQuestionSharedService {
  constructor(
    @InjectConnection() private db: Connection,
    private mediasService: MediasService,
  ) {}

  async preloadPolls(questionIds: number[]) {
    const polls = await this.db.getRepository(Poll)
      .createQueryBuilder('poll')
      .where('poll.questionId IN (:...questionIds)', { questionIds })
      .getMany();

    const preloadedPolls: TPreloadedPollsOfQuestions = {};

    for (const questionId of questionIds) {
      preloadedPolls[questionId] = polls.find(p => p.questionId === questionId);
    }

    return preloadedPolls;
  }

  async preloadAnswers(context: User | undefined, questionIds: number[]) {
    const answers = await this.db.getRepository(Answer)
      .createQueryBuilder('answer')
      .where('answer.questionId IN (:...questionIds)', { questionIds })
      .getMany();

    let answersLiked = new Set<number>();
    let prefetchedLikes: { [answerId: number]: number } = {};

    // Prefetch answer likes
    if (answers.length) {
      prefetchedLikes = await this.prefetchLikes(answers);

      if (context) {
        answersLiked = await this.answersLikedByUser(answers, context);
      }
    }

    // Map likes & answer data
    const preloadedAnswers: TPreloadedAnswersOfQuestions = {};

    for (const questionId of questionIds) {
      const answer = answers.find(p => p.questionId === questionId);

      if (answer) {
        preloadedAnswers[questionId] = {
          id: answer.id,
          content: answer.content,
          createdAt: answer.createdAt.toISOString(),
          liked: answersLiked.has(answer.id),
          likeCount: prefetchedLikes[answer.id] || 0,
        };

        if (answer.linkedImage) {
          preloadedAnswers[questionId].attachment = {
            type: answer.linkedImage.endsWith('.gif') ? 'gif' : 'image',
            url: this.mediasService.getImagePublicUrl(answer.linkedImage, EImageType.Answer),
          };
        }
      } else {
        preloadedAnswers[questionId] = null;
      }
    }

    return preloadedAnswers;
  }

  async preloadQuestionsReplyCount(questionIds: number[]) {
    const countReplies = await this.db.getRepository(Question)
      .createQueryBuilder('question')
      .select('question.inReplyToQuestionId', 'questionid')
      .addSelect('COUNT(question.id)', 'replies')
      .where('question.inReplyToQuestionId IN (:...questionIds)', { questionIds })
      .groupBy('question.inReplyToQuestionId')
      .orderBy('question.inReplyToQuestionId')
      .getRawMany<{ questionid: string, replies: string }>();

    const mappedByQuestion: { [questionId: number]: number } = {};

    for (const replyCount of countReplies) {
      mappedByQuestion[replyCount.questionid] = Number(replyCount.replies);
    }

    return mappedByQuestion;
  }

  private async answersLikedByUser(answers: Answer[], user: User) {
    const likes = await this.db.getRepository(Like)
      .createQueryBuilder('qlike')
      .where('qlike.answerId IN (:...answerIds)', { answerIds: answers.map(a => a.id) })
      .andWhere('qlike.emitterId = :userId', { userId: user.id })
      .getMany();

    return new Set(likes.map(l => l.answerId));
  }

  private async prefetchLikes(answers: Answer[]) {
    const countLikes = await this.db.getRepository(Like)
      .createQueryBuilder('qlike')
      .select('qlike.answerId', 'answerid')
      .addSelect('COUNT(qlike.id)', 'likes')
      .where('qlike.answerId IN (:...answerIds)', { answerIds: answers.map(a => a.id) })
      .groupBy('qlike.answerId')
      .orderBy('qlike.answerId')
      .getRawMany<{ answerid: string, likes: string }>();

    const mappedByAnswers: { [answerId: number]: number } = {};

    for (const likeCount of countLikes) {
      mappedByAnswers[likeCount.answerid] = Number(likeCount.likes);
    }

    return mappedByAnswers;
  }
}
