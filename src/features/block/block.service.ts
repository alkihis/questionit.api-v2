import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection, In } from 'typeorm';
import { SendableRelationshipSharedService } from '../../shared/modules/sendable/sendable.relationship.shared.service';
import { ErrorService } from '../../shared/modules/errors/error.service';
import { EApiError } from '../../shared/modules/errors/error.enum';
import { User } from '../../database/entities/user.entity';
import { Block } from '../../database/entities/block.entity';
import { Question } from '../../database/entities/question.entity';
import { Relationship } from '../../database/entities/relationship.entity';
import { RequestContextService } from '../../shared/modules/context/request.context.service';

@Injectable()
export class BlockService {
  constructor(
    @InjectConnection() private db: Connection,
    private readonly sendableRelationshipService: SendableRelationshipSharedService,
    private readonly requestContextService: RequestContextService,
  ) {}

  async blockUser(userId: number) {
    const user = this.requestContextService.user;
    const { targetUser, relationship } = await this.getUserAndRelationshipWith(userId);

    if (!relationship.hasBlocked) {
      await this.makeUserBlock(user.entity, targetUser);
    }

    return await this.sendableRelationshipService.relationshipBetween(user.entity, targetUser);
  }

  async unblockUser(userId: number) {
    const user = this.requestContextService.user;
    const { targetUser, relationship } = await this.getUserAndRelationshipWith(userId);

    if (relationship.hasBlocked) {
      await this.db.getRepository(Block).delete({ ownerId: user.id, targetId: userId });
    }

    return await this.sendableRelationshipService.relationshipBetween(user.entity, targetUser);
  }

  private async getUserAndRelationshipWith(userId: number) {
    const user = this.requestContextService.user;

    if (user.id === userId) {
      throw ErrorService.throw(EApiError.BadRequest);
    }

    const targetUser = await ErrorService.fulfillOrHttpException(
      this.db.getRepository(User).findOneOrFail({ where: { id: userId } }),
      EApiError.UserNotFound,
    );
    const relationship = await this.sendableRelationshipService.relationshipBetween(user.entity, targetUser);

    return { targetUser, relationship };
  }

  private async makeUserBlock(source: User, target: User) {
    // Remove any unanswered question from blocked user
    const deletableQuestions = await this.db.getRepository(Question)
      .createQueryBuilder('question')
      .leftJoin('question.answer', 'answer')
      .where('answer IS NULL')
      // Remove any unanswered question from blocked user & remove any unanswered question to blocked user
      .andWhere('((question.ownerId = :sourceUserId AND question.receiverId = :targetUserId) OR (question.ownerId = :targetUserId AND question.receiverId = :sourceUserId))')
      .setParameters({ targetUserId: target.id, sourceUserId: source.id })
      .select(['question.id'])
      .getMany();

    if (deletableQuestions.length) {
      await this.db.getRepository(Question).delete({ id: In(deletableQuestions.map(q => q.id)) });
    }

    // Remove any relationship between the two user
    await this.db.getRepository(Relationship)
      .createQueryBuilder()
      .delete()
      .where('(fromUserId = :sourceUserId AND toUserId = :targetUserId)')
      .orWhere('(toUserId = :sourceUserId AND fromUserId = :targetUserId)')
      .setParameters({ targetUserId: target.id, sourceUserId: source.id })
      .execute();

    const blockEntity = this.db.getRepository(Block).create({
      ownerId: source.id,
      targetId: target.id,
    });

    return await this.db.getRepository(Block).save(blockEntity);
  }
}
