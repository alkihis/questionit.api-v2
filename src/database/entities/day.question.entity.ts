import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Question } from './question.entity';

export type TDayQuestionLanguage = 'fr' | 'en';
export type TDayQuestionJsonbContent = {
  [K in TDayQuestionLanguage]: string;
};

@Entity('day_question', { schema: 'public' })
export class DayQuestion {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column('jsonb', { name: 'content', nullable: false })
  content: TDayQuestionJsonbContent;

  @Column('boolean', { name: 'hidden', nullable: false, default: false })
  hidden: boolean;

  @OneToMany(type => Question, question => question.questionOfTheDay)
  instances: Question[];
}
