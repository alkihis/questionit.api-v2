import { Entity, Column, ManyToOne, Index, PrimaryGeneratedColumn, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { QuestionItApplication } from './questionit.application.entity';

@Entity('token', { schema: 'public' })
export class Token {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Index('i_token_jti_unique', { unique: true })
  @Column('text', { name: 'jti', nullable: false })
  jti: string;

  @Column('timestamptz', { name: 'created_at', nullable: false, default: () => 'now()' })
  createdAt: Date;

  @Column('timestamptz', { name: 'updated_at', nullable: false, default: () => 'now()' })
  updatedAt: Date;

  @Column('varchar', { name: 'open_ip', length: 255, nullable: false })
  openIp: string;

  @Column('timestamptz', { name: 'last_login_at', nullable: false, default: () => 'now()' })
  lastLoginAt: Date;

  @Column('bigint', { name: 'rights', nullable: true })
  rights: string;

  @Column('varchar', { name: 'last_ip', nullable: true, default: null, length: 255 })
  lastIp: string;

  @Column('timestamptz', { name: 'expires_at', nullable: false, default: () => 'now()' })
  expiresAt: Date;

  @Column('int', { name: 'owner_id', nullable: false })
  ownerId: number;

  @ManyToOne(
    type => User,
    user => user.tokens,
    { cascade: true, nullable: false, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column('int', { name: 'app_id', nullable: true })
  appId: number;

  @ManyToOne(
    type => QuestionItApplication,
    app => app.tokens,
    { cascade: true, nullable: true, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'app_id', })
  application: QuestionItApplication;
}
