import { Entity, Column, ManyToOne, PrimaryGeneratedColumn, OneToMany, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { ApplicationToken } from './application.token.entity';

@Entity('questionit_application', { schema: 'public' })
export class QuestionItApplication {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column('varchar', { nullable: false, name: 'name', length: 255 })
  name: string;

  @Column('varchar', { nullable: false, name: 'key', length: 255 })
  key: string;

  @Column('text', { name: 'url', nullable: false, default: '' })
  url: string;

  @Column('bigint', { name: 'default_rights', nullable: false })
  defaultRights: string;

  @Column('timestamptz', { name: 'created_at', nullable: false, default: () => 'now()' })
  createdAt: Date;

  @Column('timestamptz', { name: 'updated_at', nullable: false, default: () => 'now()' })
  updatedAt: Date;

  @Column('int', { name: 'owner_id', nullable: false })
  ownerId: number;

  @ManyToOne(
    type => User,
    user => user.applications,
    { cascade: true, nullable: false, onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @OneToMany(type => ApplicationToken, token => token.application)
  tokens: ApplicationToken[];
}
