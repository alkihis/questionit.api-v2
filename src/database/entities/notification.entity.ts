import { Entity, Column, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import type { ENotificationType } from '../interfaces/notification.interface';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column('timestamptz', { name: 'created_at', nullable: false, default: () => 'now()' })
  createdAt: Date;

  @Column('timestamptz', { name: 'updated_at', nullable: false, default: () => 'now()' })
  updatedAt: Date;

  @Column('bool', { name: 'seen', nullable: false, default: false })
  seen: boolean;

  @Column('text', { name: 'type', nullable: false })
  type: ENotificationType;

  // ID of related object, defined by {type}
  @Column('int', { name: 'related_to', nullable: false })
  relatedTo: number;

  @Column('int', { name: 'user_id', nullable: false })
  userId: number;

  @ManyToOne(
    type => User,
    user => user.notifications,
    { cascade: true, nullable: false, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'user_id' })
  user: User;
}
