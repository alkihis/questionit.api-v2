import { Entity, Column, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('relationship', { schema: 'public' })
export class Relationship {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column('timestamptz', { name: 'created_at', nullable: false, default: () => 'now()' })
  createdAt: Date;

  @Column('timestamptz', { name: 'updated_at', nullable: false, default: () => 'now()' })
  updatedAt: Date;

  @Column('int', { name: 'from_user_id', nullable: false })
  fromUserId: number;

  @ManyToOne(
    type => User,
    user => user.followings,
    { cascade: true, nullable: false, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'from_user_id' })
  from: User;

  @Column('int', { name: 'to_user_id', nullable: false })
  toUserId: number;

  @ManyToOne(
    type => User,
    user => user.followers,
    { cascade: true, nullable: false, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'to_user_id' })
  to: User;
}
