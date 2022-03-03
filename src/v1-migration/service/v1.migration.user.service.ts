import { Injectable, Logger } from '@nestjs/common';
import { MigrationMappingContext, MigrationTransactionContext, selectFromAlias } from '../v1.migration.utils';
import { User } from '../../database/entities/user.entity';
import { ERole } from '../../shared/modules/roles/role.enum';

@Injectable()
export class V1MigrationUserService {
  async migrate() {
    Logger.log(`Starting user migration...`);
    const time = Date.now();

    const db = MigrationTransactionContext.db;
    const legacyDb = MigrationTransactionContext.legacy;

    // Get all users
    const users = await legacyDb
      .createQueryBuilder()
      .select(selectFromAlias('u', [
        '_id AS id', 'name', 'slug', 'twitter_id', 'twitter_oauth_token', 'twitter_oauth_secret',
        'profile_picture', 'banner_picture', 'ask_me_message', 'default_send_twitter', 'allow_question_of_the_day',
        'created_at', 'allow_anonymous', 'pinnedQuestion_id', 'visible', 'blocked_words', 'blocked_words_drop', 'safe_mode',
      ]))
      .from('user', 'u')
      .getRawMany();

    const usersToInsert: User[] = [];

    for (const user of users) {
      const blockedWords = (user.blocked_words ?? '').split('|').filter(e => e);

      const userToInsert = db.getRepository(User).create({
        name: user.name,
        slug: user.slug,
        twitterId: user.twitter_id,
        twitterOAuthToken: user.twitter_oauth_token,
        twitterOAuthSecret: user.twitter_oauth_secret,
        profilePicture: user.profile_picture ? user.profile_picture.slice('/users/profile/'.length) : null,
        bannerPicture: user.banner_picture ? user.banner_picture.slice('/users/profile/'.length) : null,
        askMeMessage: user.ask_me_message,
        sendQuestionsToTwitterByDefault: Number(user.default_send_twitter) === 1,
        allowQuestionOfTheDay: Number(user.allow_question_of_the_day) === 1,
        visible: Number(user.visible) === 1,
        dropQuestionsOnBlockedWord: Number(user.blocked_words_drop) === 1,
        createdAt: new Date(user.created_at),
        updatedAt: new Date(),
        allowAnonymousQuestions: Number(user.allow_anonymous) === 1,
        pinnedQuestionId: null, // TODO to do ?
        role: ERole.User,
        blockedWords,
        useRocketEmojiInQuestions: true,
        useHashtagInQuestions: null,
      });

      usersToInsert.push(userToInsert);

      if (user.pinnedQuestion_id) {
        MigrationMappingContext.map.pinnedQuestionsToAttach.set(Number(user.id), Number(user.pinnedQuestion_id));
      }
    }

    await db.getRepository(User).save(usersToInsert);
    Logger.log(`Migrated ${usersToInsert.length} users in ${Date.now() - time}ms.`);

    let i = 0;
    for (const user of users) {
      const newUser = usersToInsert[i];

      MigrationMappingContext.map.users.set(Number(user.id), newUser.id);
      i++;
    }
  }
}
