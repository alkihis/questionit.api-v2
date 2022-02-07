import { Entity, Column, ManyToOne, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Question } from './question.entity';

@Entity('poll', { schema: 'public' })
export class Poll {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column('timestamptz', { name: 'created_at', nullable: false, default: () => 'now()' })
  createdAt: Date;

  @Column('timestamptz', { name: 'updated_at', nullable: false, default: () => 'now()' })
  updatedAt: Date;

  @Column('varchar', { name: 'emitter_ip', nullable: true, length: 64, default: null })
  emitterIp: string;

  @Column('jsonb', { name: 'options', nullable: false })
  options: string[];

  @Column('int', { name: 'owner_id', nullable: false })
  ownerId: number;

  @ManyToOne(type => User, { cascade: true, nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column('int', { name: 'question_id', nullable: true })
  questionId: number;

  @OneToOne(type => Question, question => question.poll, { cascade: true, nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: Question;
}
