import { Entity, Column, ManyToOne, OneToMany, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Poll } from './poll.entity';
import { Answer } from './answer.entity';
import { DayQuestion } from './day.question.entity';

@Entity('question', { schema: 'public' })
export class Question {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column('timestamptz', { name: 'created_at', nullable: false, default: () => 'now()' })
  createdAt: Date;

  @Column('timestamptz', { name: 'updated_at', nullable: false, default: () => 'now()' })
  updatedAt: Date;

  @Column('text', { name: 'content', nullable: false })
  content: string;

  @Column('bool', { name: 'seen', nullable: false, default: false })
  seen: boolean;

  @Column('bool', { name: 'muted', nullable: false, default: false })
  muted: boolean;

  @Column('varchar', { name: 'tweet_id', length: 255, nullable: true, default: null })
  tweetId: string;

  @OneToMany(type => Question, question => question.inReplyToQuestion)
  replies: Question[];

  @Column('varchar', { name: 'conversation_id', length: 255 })
  conversationId: string;

  @Column('varchar', { name: 'emitter_ip', length: 255, nullable: true })
  emitterIp: string;

  @OneToOne(type => Poll, poll => poll.question)
  poll: Poll;

  @OneToOne(type => Answer, answer => answer.question)
  answer: Answer;

  @Column('int', { name: 'in_reply_to_question_id', nullable: true, default: null })
  inReplyToQuestionId: number;

  @ManyToOne(type => Question, question => question.replies, { cascade: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'in_reply_to_question_id' })
  inReplyToQuestion: Question;

  @Column('int', { name: 'question_of_the_day_id', nullable: true, default: null })
  questionOfTheDayId: number;

  @ManyToOne(type => DayQuestion, question => question.instances, { cascade: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'question_of_the_day_id' })
  questionOfTheDay: DayQuestion;

  @Column('int', { name: 'private_owner_id', nullable: true })
  privateOwnerId: number;

  @ManyToOne(type => User, { cascade: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'private_owner_id' })
  privateOwner: User;

  @Column('int', { name: 'owner_id', nullable: true })
  ownerId: number;

  @ManyToOne(type => User, user => user.askedQuestions, { cascade: true, nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column('int', { name: 'receiver_id', nullable: true })
  receiverId: number;

  @ManyToOne(type => User, user => user.receivedQuestions, { cascade: true, nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'receiver_id' })
  receiver: User;
}
