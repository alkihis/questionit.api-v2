import { Entity, Column, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Answer } from './answer.entity';

@Entity()
export class Like {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column('timestamptz', { name: 'created_at', nullable: false, default: () => 'now()' })
  createdAt: Date;

  @Column('timestamptz', { name: 'updated_at', nullable: false, default: () => 'now()' })
  updatedAt: Date;

  @Column('int', { name: 'emitter_id', nullable: false })
  emitterId: number;

  @ManyToOne(
    type => User,
    user => user.likedQuestions,
    { cascade: true, nullable: false, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'emitter_id' })
  emitter: User;

  @Column('int', { name: 'answer_id', nullable: false })
  answerId: number;

  @ManyToOne(
    type => Answer,
    q => q.likes,
    { cascade: true, nullable: false, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'answer_id' })
  answer: Answer;
}
