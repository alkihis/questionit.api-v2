import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { ErrorService } from '../../shared/modules/errors/error.service';
import { EApiError } from '../../shared/modules/errors/error.enum';
import { SendableRelationshipSharedService } from '../../shared/modules/sendable/sendable.relationship.shared.service';
import { RequestUserManager } from '../../shared/managers/request.user.manager';
import { ListFollowersOrFollowingsDto } from './relationship.dto';
import { paginate } from '../../shared/utils/pagination/pagination.utils';
import { Relationship } from '../../database/entities/relationship.entity';
import { SendableSharedService } from '../../shared/modules/sendable/sendable.shared.service';
import { ISentUser } from '../../database/interfaces/user.interface';
import { ERedisExpiration, ERedisPrefix, RedisService } from '../../shared/modules/redis/redis.service';
import { Notification } from '../../database/entities/notification.entity';
import { ENotificationType, INotificationNewFollowerContentPayload } from '../../database/interfaces/notification.interface';
import { NotificationSharedService } from '../../shared/modules/notifications/notification.shared.service';

@Injectable()
export class RelationshipService {
  constructor(
    @InjectConnection() private db: Connection,
    private sendableService: SendableSharedService,
    private sendableRelationshipService: SendableRelationshipSharedService,
    private notificationSharedService: NotificationSharedService,
  ) {}

  async getRelationshipBetween(userId1: number, userId2: number) {
    const users = await this.db.getRepository(User)
      .createQueryBuilder('user')
      .where('user.id IN (:...userIds)', { userIds: [userId1, userId2] })
      .getMany();

    const user1 = users.find(u => u.id === userId1);
    const user2 = users.find(u => u.id === userId2);

    if (!user1 || !user2) {
      throw ErrorService.throw(EApiError.UserNotFound);
    } else if (user1.id === user2.id) {
      throw ErrorService.throw(EApiError.RelationShouldBeBetweenTwoDifferentUsers);
    }

    return await this.sendableRelationshipService.relationshipBetween(user1, user2);
  }

  async getFollowersList(user: RequestUserManager, targetUserId: number, pagination: ListFollowersOrFollowingsDto) {
    // Followers of targetUserId: relationships where toUserId=targetUserId

    return paginate<User, ISentUser>({
      qb: this.db.getRepository(User)
        .createQueryBuilder('user')
        .innerJoin(Relationship, 'relationship', 'relationship.fromUserId = user.id')
        .addSelect('relationship.createdAt')
        .where('relationship.toUserId = :targetUserId', { targetUserId })
        .orderBy('relationship.createdAt', 'DESC'),
      paginationDto: pagination,
      convertItems: items => this.sendableService.getSendableUsers(items, {
        context: user.entity,
        withRelationships: true,
        withCounts: true,
      }),
    });
  }

  async getFollowingsList(user: RequestUserManager, targetUserId: number, pagination: ListFollowersOrFollowingsDto) {
    // Followers of targetUserId: relationships where fromUserId=targetUserId

    return paginate<User, ISentUser>({
      qb: this.db.getRepository(User)
        .createQueryBuilder('user')
        .innerJoin(Relationship, 'relationship', 'relationship.toUserId = user.id')
        .addSelect('relationship.createdAt')
        .where('relationship.fromUserId = :targetUserId', { targetUserId })
        .orderBy('relationship.createdAt', 'DESC'),
      paginationDto: pagination,
      convertItems: items => this.sendableService.getSendableUsers(items, {
        context: user.entity,
        withRelationships: true,
        withCounts: true,
      }),
    });
  }

  async follow(sourceUser: User, targetUserId: number) {
    const targetUser = await ErrorService.fulfillOrHttpException(
      this.db.getRepository(User)
        .createQueryBuilder('user')
        .where('user.id = :targetUserId', { targetUserId })
        .leftJoinAndSelect('user.pushSubscriptions', 'subscriptions')
        .getOneOrFail(),
      EApiError.UserNotFound,
    );

    const relationshipRepository = this.db.getRepository(Relationship);

    // Follow of user=>targetUserId
    const exisitingFollow = await relationshipRepository
      .createQueryBuilder('relationship')
      .where('relationship.toUserId = :targetUserId', { targetUserId })
      .andWhere('relationship.fromUserId = :userId', { userId: sourceUser.id })
      .getOne();

    if (exisitingFollow) {
      // Don't do anything
      return await this.getRelationshipBetween(sourceUser.id, targetUserId);
    }

    // Register the follow status
    const follow = relationshipRepository.create({
      fromUserId: sourceUser.id,
      toUserId: targetUserId,
    });

    await relationshipRepository.save(follow);

    const notification = await this.registerFollowNotification(sourceUser, targetUser);
    if (notification) {
      this.sendPushMessageForFollow(notification, sourceUser, targetUser)
        .catch(err => Logger.error('Unable to send notification for follow:', err));
    }

    return await this.getRelationshipBetween(sourceUser.id, targetUserId);
  }

  async unfollow(sourceUser: User, targetUserId: number) {
    const relationshipRepository = this.db.getRepository(Relationship);

    // Follow of user=>targetUserId
    const exisitingFollow = await relationshipRepository
      .createQueryBuilder('relationship')
      .where('relationship.toUserId = :targetUserId', { targetUserId })
      .andWhere('relationship.fromUserId = :userId', { userId: sourceUser.id })
      .getOne();

    if (!exisitingFollow) {
      // Don't do anything
      return await this.getRelationshipBetween(sourceUser.id, targetUserId);
    }

    await this.db.getRepository(Relationship).delete({ fromUserId: sourceUser.id, toUserId: targetUserId });
    // Delete the possible follow notifications
    await this.db.getRepository(Notification)
      .createQueryBuilder()
      .delete()
      .where('type IN (:...followNotificationTypes)', { followNotificationTypes: [ENotificationType.Follow, ENotificationType.FollowBack] })
      .andWhere('relatedTo = :fromUserId', { fromUserId: sourceUser.id })
      .andWhere('userId = :targetUserId', { targetUserId })
      .execute();

    return await this.getRelationshipBetween(sourceUser.id, targetUserId);
  }

  private async registerFollowNotification(follower: User, followed: User) {
    const followHashName = ERedisPrefix.FollowNotification + `${follower.id}-${followed.id}`;
    const followedRecently = await RedisService.getObject(followHashName);

    if (followedRecently) {
      // Notification sent less than three hours ago, do nothing
      return;
    }

    const notification = await this.createNotificationFromFollow(follower, followed);
    await RedisService.setObject(followHashName, { follow: true }, ERedisExpiration.FollowNotification);

    return notification;
  }

  private async sendPushMessageForFollow(notification: Notification, follower: User, followed: User) {
    const pushMessagePayload: INotificationNewFollowerContentPayload = {
      id: notification.id,
      user: await this.sendableService.getSendableUser(follower, {
        context: followed,
        withRelationships: true,
        withCounts: true,
      }),
    };

    await this.notificationSharedService.pushNotification(followed.pushSubscriptions, pushMessagePayload);
  }

  private async createNotificationFromFollow(follower: User, followed: User) {
    const possibleFollowBack = await this.db.getRepository(Relationship)
      .createQueryBuilder('relationship')
      .where('relationship.fromUserId = :targetUserId', { targetUserId: followed.id })
      .andWhere('relationship.toUserId = :userId', { userId: follower.id })
      .getOne();

    // Create notification
    const notification = this.db.getRepository(Notification).create({
      relatedTo: follower.id,
      type: possibleFollowBack ? ENotificationType.FollowBack : ENotificationType.Follow,
      userId: followed.id,
    });

    return await this.db.getRepository(Notification).save(notification);
  }
}
