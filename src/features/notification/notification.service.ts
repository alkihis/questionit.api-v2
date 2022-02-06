import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection, In, IsNull } from 'typeorm';
import { RequestUserManager } from '../../shared/managers/request.user.manager';
import { ListNotificationDto } from './notification.dto';
import { paginateWithIds } from '../../shared/utils/pagination/pagination.utils';
import { Notification } from '../../database/entities/notification.entity';
import { SendableSharedService } from '../../shared/modules/sendable/sendable.shared.service';
import { EApplicationRight } from '../../database/enums/questionit.application.enum';
import { INotificationCounts } from '../../database/interfaces/notification.interface';
import { Question } from '../../database/entities/question.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectConnection() private db: Connection,
    private sendableService: SendableSharedService,
  ) {}

  async listNotifications(user: RequestUserManager, query: ListNotificationDto) {
    const paginatedNotifications = await paginateWithIds({
      qb: this.db.getRepository(Notification)
        .createQueryBuilder('notification')
        .where('notification.userId = :userId', { userId: user.id }),
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

  async markAllNotificationsAsSeen(user: RequestUserManager) {
    await this.db.getRepository(Notification)
      .update({ userId: user.id }, { seen: true });
  }

  async getNotificationCounts(user: RequestUserManager) {
    const counts: INotificationCounts = {
      questions: 0,
      notifications: await this.db.getRepository(Notification).count({ where: { userId: user.id } }),
    };

    if (user.hasRight(EApplicationRight.ReadWaitingQuestions)) {
      counts.questions = await this.db.getRepository(Question)
        .createQueryBuilder('question')
        .leftJoin('question.answer', 'answer')
        .where('question.receiverId = :userId', { userId: user.id })
        .andWhere('answer IS NULL')
        .getCount();
    }

    return counts;
  }

  async deleteNotificationById(user: RequestUserManager, id: string) {
    if (id === 'all') {
      await this.db.getRepository(Notification).delete({ userId: user.id });
    } else {
      const numberId = Number(id) || 0;

      await this.db.getRepository(Notification).delete({ userId: user.id, id: numberId });
    }
  }
}
