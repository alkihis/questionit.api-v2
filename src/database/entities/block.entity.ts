import { Entity, Column, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('block', { schema: 'public' })
export class Block {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column('timestamptz', { name: 'created_at', nullable: false, default: () => 'now()' })
  createdAt: Date;

  @Column('timestamptz', { name: 'updated_at', nullable: false, default: () => 'now()' })
  updatedAt: Date;

  @Column('int', { name: 'owner_id', nullable: false })
  ownerId: number;

  @ManyToOne(
    type => User,
    user => user.madeBlocks,
    { cascade: true, nullable: false, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column('int', { name: 'target_id', nullable: false })
  targetId: number;

  @ManyToOne(
    type => User,
    user => user.receivedBlocks,
    { cascade: true, nullable: false, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'target_id' })
  target: User;
}
