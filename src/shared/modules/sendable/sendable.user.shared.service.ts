import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { User } from '../../../database/entities/user.entity';
import { ISentUserCounts } from '../../../database/interfaces/user.interface';
import { Answer } from '../../../database/entities/answer.entity';
import { Relationship } from '../../../database/entities/relationship.entity';

export type TPreloadedUserCounts = { [userId: number]: ISentUserCounts };

@Injectable()
export class SendableUserSharedService {
  constructor(
    @InjectConnection() private db: Connection,
  ) {}

  async preloadCountsForUsers(users: User[]) {
    const [followings, followers, answers] = await Promise.all([
      this.preloadFollowingsCount(users),
      this.preloadFollowersCount(users),
      this.preloadAnswerCount(users),
    ]);

    const sentCounts: TPreloadedUserCounts = {};

    for (const user of users) {
      sentCounts[user.id] = {
        followings: followings[user.id] || 0,
        followers: followers[user.id] || 0,
        answers: answers[user.id] || 0,
      };
    }

    return sentCounts;
  }

  private async preloadFollowingsCount(users: User[]) {
    const countRelationships = await this.db.getRepository(Relationship)
      .createQueryBuilder('relationship')
      .select('relationship.fromUserId', 'userid')
      .addSelect('COUNT(relationship.toUserId)', 'followings')
      .where('relationship.fromUserId IN (:...userIds)', { userIds: users.map(u => u.id) })
      .groupBy('relationship.fromUserId')
      .orderBy('relationship.fromUserId')
      .getRawMany<{ userid: string, followings: string }>();

    const mappedByUser: { [userId: number]: number } = {};

    for (const relationshipCount of countRelationships) {
      mappedByUser[relationshipCount.userid] = Number(relationshipCount.followings);
    }

    return mappedByUser;
  }

  private async preloadFollowersCount(users: User[]) {
    const countRelationships = await this.db.getRepository(Relationship)
      .createQueryBuilder('relationship')
      .select('relationship.toUserId', 'userid')
      .addSelect('COUNT(relationship.fromUserId)', 'followers')
      .where('relationship.toUserId IN (:...userIds)', { userIds: users.map(u => u.id) })
      .groupBy('relationship.toUserId')
      .orderBy('relationship.toUserId')
      .getRawMany<{ userid: string, followers: string }>();

    const mappedByUser: { [userId: number]: number } = {};

    for (const relationshipCount of countRelationships) {
      mappedByUser[relationshipCount.userid] = Number(relationshipCount.followers);
    }

    return mappedByUser;
  }

  private async preloadAnswerCount(users: User[]) {
    const countAnswers = await this.db.getRepository(Answer)
      .createQueryBuilder('answer')
      .select('answer.ownerId', 'userid')
      .addSelect('COUNT(answer.id)', 'answers')
      .where('answer.ownerId IN (:...userIds)', { userIds: users.map(u => u.id) })
      .groupBy('answer.ownerId')
      .orderBy('answer.ownerId')
      .getRawMany<{ userid: string, answers: string }>();

    const mappedByUser: { [userId: number]: number } = {};

    for (const answerCount of countAnswers) {
      mappedByUser[answerCount.userid] = Number(answerCount.answers);
    }

    return mappedByUser;
  }
}
