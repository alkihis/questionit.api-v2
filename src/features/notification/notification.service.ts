import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection, In } from 'typeorm';
import { RequestUserManager } from '../../shared/managers/request.user.manager';
import { ListNotificationDto } from './notification.dto';
import { paginateWithIds } from '../../shared/utils/pagination/pagination.utils';
import { Notification } from '../../database/entities/notification.entity';
import { SendableSharedService } from '../../shared/modules/sendable/sendable.shared.service';
import { EApplicationRight } from '../../database/enums/questionit.application.enum';
import { ENotificationType, INotificationCounts } from '../../database/interfaces/notification.interface';
import { Question } from '../../database/entities/question.entity';
import { RequestContextService } from '../../shared/modules/context/request.context.service';

@Injectable()
export class NotificationService {
  constructor(
    @InjectConnection() private db: Connection,
    private sendableService: SendableSharedService,
    private requestContextService: RequestContextService,
  ) {}

  async listNotifications(query: ListNotificationDto) {
    const user = this.requestContextService.user;
    const paginatedNotifications = await paginateWithIds({
      qb: this.getNotificationOfUserQb(user),
      paginationDto: query,
      convertItems: items => this.sendableService.getSendableNotifications(items, { context: user.entity }),
    });

    if (query.markAsSeen && paginatedNotifications.items.length) {
      const notificationIds = paginatedNotifications.items
        .map(n => Number(n.id));

      await this.db.getRepository(Notification)
        .update({ id: In(notificationIds) }, { seen: true });
    }

    return paginatedNotifications;
  }

  async markAllNotificationsAsSeen() {
    const user = this.requestContextService.user;
    await this.db.getRepository(Notification)
      .update({ userId: user.id }, { seen: true });
  }

  async getNotificationCounts() {
    const user = this.requestContextService.user;
    const counts: INotificationCounts = {
      questions: 0,
      notifications: await this.getNotificationOfUserQb(user)
        .andWhere('notification.seen = FALSE')
        .getCount(),
    };

    if (user.hasRight(EApplicationRight.ReadWaitingQuestions)) {
      counts.questions = await this.db.getRepository(Question)
        .createQueryBuilder('question')
        .leftJoin('question.answer', 'answer')
        .where('question.receiverId = :userId', { userId: user.id })
        .andWhere('answer.id IS NULL')
        .getCount();
    }

    return counts;
  }

  async deleteNotificationById(id: string) {
    const user = this.requestContextService.user;

    if (id === 'all') {
      await this.db.getRepository(Notification).delete({ userId: user.id });
    } else {
      const numberId = Number(id) || 0;

      await this.db.getRepository(Notification).delete({ userId: user.id, id: numberId });
    }
  }

  private getNotificationOfUserQb(user: RequestUserManager) {
    const availableTypes: ENotificationType[] = [ENotificationType.Answered];

    if (user.hasRight(EApplicationRight.ReadRelationship)) {
      availableTypes.push(ENotificationType.Follow, ENotificationType.FollowBack);
    }
    if (user.hasRight(EApplicationRight.ReadWaitingQuestions)) {
      availableTypes.push(ENotificationType.Question);
    }

    return this.db.getRepository(Notification)
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId: user.id })
      .andWhere('notification.type IN (:...availableTypes)', { availableTypes });
  }
}
