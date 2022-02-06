import { Entity, Column, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { IPushMessageContentJsonbModel } from '../interfaces/push.message.interface';

@Entity('push_message', { schema: 'public' })
export class PushMessage {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column('timestamptz', { name: 'created_at', nullable: false, default: () => 'now()' })
  createdAt: Date;

  @Column('timestamptz', { name: 'updated_at', nullable: false, default: () => 'now()' })
  updatedAt: Date;

  @Column('text', { name: 'endpoint', nullable: false })
  endpoint: string;

  // JSON notification object
  @Column('jsonb', { name: 'content', nullable: false })
  content: IPushMessageContentJsonbModel;

  @Column('int', { name: 'target_user_id', nullable: false })
  targetUserId: number;

  @ManyToOne(type => User, user => user.pushSubscriptions, { cascade: true, nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'target_user_id' })
  target: User;
}
