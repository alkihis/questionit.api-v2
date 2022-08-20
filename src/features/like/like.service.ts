import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectDataSource } from '@nestjs/typeorm';
import { Connection, DataSource } from 'typeorm';
import { SendableSharedService } from '../../shared/modules/sendable/sendable.shared.service';
import { Question } from '../../database/entities/question.entity';
import { ErrorService } from '../../shared/modules/errors/error.service';
import { EApiError } from '../../shared/modules/errors/error.enum';
import { Like } from '../../database/entities/like.entity';
import { BlockSharedService } from '../../shared/modules/blocks/block.shared.service';
import { EApplicationRight } from '../../database/enums/questionit.application.enum';
import { RequestContextService } from '../../shared/modules/context/request.context.service';

@Injectable()
export class LikeService {
  constructor(
    @InjectDataSource() private db: DataSource,
    private sendableService: SendableSharedService,
    private blockSharedService: BlockSharedService,
    private requestContextService: RequestContextService,
  ) {}

  async createLike(answerId: number) {
    const user = this.requestContextService.user;
    const likeRepository = this.db.getRepository(Like);
    const question = await this.getQuestionWithAnswer(answerId);
    const likeExists = await likeRepository.count({ where: { emitterId: user.id, answerId } });

    if (!likeExists) {
      await this.blockSharedService.ensureUserCanSeeTarget(user, question.receiverId);
      await likeRepository.save(likeRepository.create({ emitterId: user.id, answerId }));
    }

    return await this.sendableService.getSendableQuestion(question, {
      context: user.entity,
      withUserRelationships: user.hasRight(EApplicationRight.ReadRelationship),
    });
  }

  async deleteLike(answerId: number) {
    const user = this.requestContextService.user;
    const question = await this.getQuestionWithAnswer(answerId);

    await this.db.getRepository(Like)
      .delete({ emitterId: user.id, answerId });

    return await this.sendableService.getSendableQuestion(question, {
      context: user.entity,
      withUserRelationships: user.hasRight(EApplicationRight.ReadRelationship),
    });
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
