import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { RequestUserManager } from '../../shared/managers/request.user.manager';
import { SendableSharedService } from '../../shared/modules/sendable/sendable.shared.service';
import { Question } from '../../database/entities/question.entity';
import { ErrorService } from '../../shared/modules/errors/error.service';
import { EApiError } from '../../shared/modules/errors/error.enum';
import { Like } from '../../database/entities/like.entity';
import { BlockSharedService } from '../../shared/modules/blocks/block.shared.service';

@Injectable()
export class LikeService {
  constructor(
    @InjectConnection() private db: Connection,
    private sendableService: SendableSharedService,
    private blockSharedService: BlockSharedService,
  ) {}

  async createLike(user: RequestUserManager, answerId: number) {
    const likeRepository = this.db.getRepository(Like);
    const question = await this.getQuestionWithAnswer(answerId);
    const likeExists = await likeRepository.count({ where: { emitterId: user.id, answerId } });

    if (!likeExists) {
      await this.blockSharedService.ensureUserCanSeeTarget(user, question.receiverId);
      await likeRepository.save(likeRepository.create({ emitterId: user.id, answerId }));
    }

    return await this.sendableService.getSendableQuestion(question, { context: user.entity });
  }

  async deleteLike(user: RequestUserManager, answerId: number) {
    const question = await this.getQuestionWithAnswer(answerId);

    await this.db.getRepository(Like)
      .delete({ emitterId: user.id, answerId });

    return await this.sendableService.getSendableQuestion(question, { context: user.entity });
  }

  private getQuestionWithAnswer(answerId: number) {
    return ErrorService.fulfillOrHttpException(
      this.db.getRepository(Question)
        .createQueryBuilder('question')
        .innerJoinAndSelect('question.answer', 'answer')
        .where('answer.id = :answerId', { answerId })
        .getOneOrFail(),
      EApiError.QuestionNotFound,
    );
  }
}
