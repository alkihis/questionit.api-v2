import { Entity, Column, Index, OneToMany, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { Token } from './token.entity';
import { Relationship } from './relationship.entity';
import { PushMessage } from './push.message.entity';
import { Block } from './block.entity';
import { Question } from './question.entity';
import { QuestionItApplication } from './questionit.application.entity';
import { Like } from './like.entity';
import { Notification } from './notification.entity';
import { ERole } from '../../shared/modules/roles/role.enum';

@Entity('user', { schema: 'public' })
export class User {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  /**
   * Used to show user. Can contain any character.
   */
  @Column('varchar', { name: 'name', nullable: false, length: 255 })
  name: string;

  /**
   * Used to generate the /u/:slug page
   *
   * You must NOT set a number only slug, this is reserved if slug is already taken when a user registers.
   *
   * Slug regex: /[a-z][\w_-]{1,31}/i
   */
  @Column('varchar', { name: 'slug', nullable: false, length: 64 })
  slug: string;

  @Column('enum', { enum: ERole, enumName: 'e_user_roles', name: 'role', nullable: false, default: ERole.User })
  role: ERole;

  @Index('i_user_twitter_id_unique', { unique: true })
  @Column('varchar', { name: 'twitter_id', nullable: false, length: 255 })
  twitterId: string;

  @Column('varchar', { name: 'twitter_oauth_token', nullable: false, length: 255 })
  twitterOAuthToken: string;

  @Column('varchar', { name: 'twitter_oauth_secret', length: 255, nullable: false })
  twitterOAuthSecret: string;

  @Column('varchar', { name: 'profile_picture', length: 255, nullable: true, default: null })
  profilePicture: string;

  @Column('varchar', { name: 'banner_picture', length: 255, nullable: true, default: null })
  bannerPicture: string;

  @Column('text', { name: 'ask_me_message', default: 'Ask me something!' })
  askMeMessage: string;

  @Column('bool', { name: 'send_questions_to_twitter_by_default', default: true })
  sendQuestionsToTwitterByDefault: boolean;

  @Column('bool', { name: 'allow_question_of_the_day', default: true })
  allowQuestionOfTheDay: boolean;

  @Column('bool', { name: 'visible', default: true })
  visible: boolean;

  @Column('jsonb', { name: 'blocked_words', nullable: false, default: () => 'jsonb_build_array()' })
  blockedWords: string[];

  @Column('bool', { name: 'drop_questions_on_blocked_word', default: false, nullable: false })
  dropQuestionsOnBlockedWord: boolean;

  @Column('timestamptz', { name: 'created_at', nullable: false, default: () => 'now()' })
  createdAt: Date;

  @Column('timestamptz', { name: 'updated_at', nullable: false, default: () => 'now()' })
  updatedAt: Date;

  @Column('bool', { name: 'allow_anonymous_questions', nullable: false, default: true })
  allowAnonymousQuestions: boolean;

  @Column('bool', { name: 'safe_mode', nullable: false, default: true })
  safeMode: boolean;

  @Column('int', { name: 'pinned_question_id', nullable: true })
  pinnedQuestionId: number;

  @OneToOne(type => Question, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'pinned_question_id' })
  pinnedQuestion: Question;

  @OneToMany(type => Token, token => token.owner)
  tokens: Token[];

  @OneToMany(type => Question, question => question.owner)
  askedQuestions: Question[];

  @OneToMany(type => Question, question => question.receiver)
  receivedQuestions: Question[];

  @OneToMany(type => Like, like => like.emitter)
  likedQuestions: Like[];

  @OneToMany(type => PushMessage, msg => msg.target)
  pushSubscriptions: PushMessage[];

  @OneToMany(type => Block, block => block.owner)
  madeBlocks: Block[];

  @OneToMany(type => Block, block => block.target)
  receivedBlocks: Block[];

  @OneToMany(type => Relationship, follow => follow.from)
  followings: Relationship[];

  @OneToMany(type => Relationship, follow => follow.to)
  followers: Relationship[];

  @OneToMany(type => QuestionItApplication, app => app.owner)
  applications: QuestionItApplication[];

  @OneToMany(type => Notification, notif => notif.user)
  notifications: Notification[];
}
