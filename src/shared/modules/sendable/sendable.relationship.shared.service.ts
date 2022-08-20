import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectDataSource } from '@nestjs/typeorm';
import { Connection, DataSource } from 'typeorm';
import { User } from '../../../database/entities/user.entity';
import { Relationship } from '../../../database/entities/relationship.entity';
import { Block } from '../../../database/entities/block.entity';
import { ISentRelationship } from '../../../database/interfaces/relationship.interface';

export type TPreloadedRelationships = { [userId: number]: ISentRelationship };

@Injectable()
export class SendableRelationshipSharedService {
  constructor(
    @InjectDataSource() private db: DataSource,
  ) {}

  async followingsOf(user: User) {
    const relationships = await this.db.getRepository(Relationship)
      .createQueryBuilder('relationship')
      .where('relationship.fromUserId = :userId', { userId: user.id })
      .select(['relationship.id', 'relationship.toUserId', 'relationship.fromUserId'])
      .getMany();

    return relationships.map(r => r.toUserId);
  }

  async relationshipBetween(sourceUser: User, targetUser: User) {
    const relationships = await this.bulkRelationships(sourceUser, [targetUser]);
    return relationships[targetUser.id];
  }

  async bulkRelationships(sourceUser: User, users: User[]) {
    const userIds = users.map(u => u.id);
    const userId = sourceUser.id;

    // Fetch relationships & blocks

    const relationshipQb = this.db.getRepository(Relationship)
      .createQueryBuilder('relationship')
      // Followers
      .where('(relationship.fromUserId IN (:...userIds) AND relationship.toUserId = :userId)', { userIds, userId })
      // Followings
      .orWhere('(relationship.toUserId IN (:...userIds) AND relationship.fromUserId = :userId)', { userIds, userId })
      .select(['relationship.id', 'relationship.toUserId', 'relationship.fromUserId']);

    const blockQb = this.db.getRepository(Block)
      .createQueryBuilder('block')
      // Users who have blocked source
      .where('(block.ownerId IN (:...userIds) AND block.targetId = :userId)', { userIds, userId })
      // Users who have been blocked by source
      .orWhere('(block.targetId IN (:...userIds) AND block.ownerId = :userId)', { userIds, userId })
      .select(['block.id', 'block.targetId', 'block.ownerId']);

    const [relationships, blocks] = await Promise.all([relationshipQb.getMany(), blockQb.getMany()]);

    const sentRelationships: TPreloadedRelationships = {};

    const followingUsers = new Set(relationships.filter(r => r.fromUserId === userId).map(r => r.toUserId));
    const followedBy = new Set(relationships.filter(r => r.toUserId === userId).map(r => r.fromUserId));
    const blockingUsers = new Set(blocks.filter(b => b.ownerId === userId).map(b => b.targetId));
    const blockedBy = new Set(blocks.filter(b => b.targetId === userId).map(b => b.ownerId));

    for (const user of users) {
      sentRelationships[user.id] = {
        following: followingUsers.has(user.id),
        followedBy: followedBy.has(user.id),
        hasBlocked: blockingUsers.has(user.id),
        isBlockedBy: blockedBy.has(user.id),
      };
    }

    return sentRelationships;
  }
}
