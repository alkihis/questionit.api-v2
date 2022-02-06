import { Entity, Column, ManyToOne, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { QuestionItApplication } from './questionit.application.entity';
import { User } from './user.entity';

@Entity('application_token', { schema: 'public' })
export class ApplicationToken {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column('timestamptz', { name: 'created_at', nullable: false, default: () => 'now()' })
  createdAt: Date;

  @Column('timestamptz', { name: 'updated_at', nullable: false, default: () => 'now()' })
  updatedAt: Date;

  @Column('text', { name: 'token', nullable: false })
  token: string;

  @Column('text', { name: 'redirect_to', nullable: false })
  redirectTo: string;

  @Column('text', { name: 'validator', nullable: true })
  validator: string;

  @Column('int', { name: 'owner_id', nullable: false })
  ownerId: number;

  @ManyToOne(
    type => User,
    { cascade: true, nullable: false, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column('int', { name: 'application_id', nullable: false })
  applicationId: number;

  @ManyToOne(
    type => QuestionItApplication,
    app => app.tokens,
    { cascade: true, nullable: false, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'application_id' })
  application: QuestionItApplication;
}
