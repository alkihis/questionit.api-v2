import { Entity, Column, ManyToOne, OneToMany, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Like } from './like.entity';
import { Question } from './question.entity';

@Entity('answer', { schema: 'public' })
export class Answer {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column('timestamptz', { name: 'created_at', nullable: false, default: () => 'now()' })
  createdAt: Date;

  @Column('timestamptz', { name: 'updated_at', nullable: false, default: () => 'now()' })
  updatedAt: Date;

  @Column('int', { name: 'owner_id', nullable: true })
  ownerId: number;

  @ManyToOne(type => User, user => user.askedQuestions, { cascade: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @OneToMany(type => Like, like => like.answer)
  likes: Like[];

  @Column('text', { name: 'content', nullable: false })
  content: string;

  @Column('text', { name: 'linked_image', nullable: true, default: null })
  linkedImage: string;

  @Column('int', { name: 'question_id', nullable: false })
  questionId: number;

  @OneToOne(type => Question, question => question.answer, { cascade: true, nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: Question;
}
