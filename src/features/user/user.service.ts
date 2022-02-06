import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { RequestUserManager } from '../../shared/managers/request.user.manager';
import { SendableSharedService } from '../../shared/modules/sendable/sendable.shared.service';
import { ErrorService } from '../../shared/modules/errors/error.service';
import { User } from '../../database/entities/user.entity';
import { EApiError } from '../../shared/modules/errors/error.enum';
import { EApplicationRight } from '../../database/enums/questionit.application.enum';
import { BlockSharedService } from '../../shared/modules/blocks/block.shared.service';
import { EditUserDto, SearchUserDto } from './user.dto';
import { paginateWithIds } from '../../shared/utils/pagination/pagination.utils';
import { getUnaccentQuery } from '../../shared/utils/query.utils';
import config from '../../shared/config/config';
import { TwitterService } from '../../shared/modules/twitter/twitter.service';
import { MediasService } from '../../shared/modules/medias/medias.service';

export type TEditProfileFiles = { [K in 'avatar' | 'background']: Express.Multer.File[] };

@Injectable()
export class UserService {
  constructor(
    @InjectConnection() private db: Connection,
    private sendableService: SendableSharedService,
    private blockSharedService: BlockSharedService,
    private twitterService: TwitterService,
    private mediasService: MediasService,
  ) {}

  async getLoggedUser(user: RequestUserManager) {
    return this.sendableService.getSendableUser(user.entity, {
      context: user.entity,
      withCounts: true,
      withPinnedQuestions: true,
      withUserOptions: true,
      withRelationships: user.hasRight(EApplicationRight.ReadRelationship),
    });
  }

  async getUserById(user: RequestUserManager | undefined, id: number) {
    const targetUser = await ErrorService.fulfillOrHttpException(this.db.getRepository(User).findOneOrFail({ id }), EApiError.UserNotFound);
    return await this.getUserFromEntity(user, targetUser);
  }

  async getUserBySlug(user: RequestUserManager | undefined, slug: string) {
    const targetUser = await ErrorService.fulfillOrHttpException(
      this.db.getRepository(User)
        .createQueryBuilder('user')
        .where('lower(user.slug) = lower(:slug)', { slug })
        .getOneOrFail(),
      EApiError.UserNotFound,
    );
    return await this.getUserFromEntity(user, targetUser);
  }

  async searchUsers(user: RequestUserManager | undefined, query: SearchUserDto) {
    return await paginateWithIds({
      paginationDto: query,
      qb: this.db.getRepository(User)
        .createQueryBuilder('user')
        .where(`(${getUnaccentQuery('user.slug')} OR ${getUnaccentQuery('user.name')})`, { query: query.q }),
      convertItems: items => this.sendableService.getSendableUsers(items, {
        context: user?.entity,
        withCounts: true,
        withPinnedQuestions: true,
        withRelationships: user?.hasRight(EApplicationRight.ReadRelationship),
      }),
    });
  }

  async isSlugAvailable(user: RequestUserManager, slug: string) {
    if (!slug) {
      throw ErrorService.throw(EApiError.InvalidParameter);
    }
    if (!slug.match(config.LIMITS.SLUG_REGEX)) {
      throw ErrorService.create(EApiError.SlugInvalidCharacters);
    }

    const targetSlug = await this.db.getRepository(User)
      .createQueryBuilder('user')
      .select(['user.id'])
      .where('lower(user.slug) = lower(:query)', { query: slug })
      .andWhere('user.id != :userId', { userId: user.id })
      .getOne();

    return { available: !targetSlug };
  }

  async syncProfileWithTwitter(user: RequestUserManager) {
    user.entity = await this.twitterService.refreshProfilePicturesFromTwitter(user.entity);
    user.entity.updatedAt = new Date();

    return await this.getLoggedUser(user);
  }

  async deleteAccount(user: RequestUserManager) {
    await this.db.getRepository(User).delete({ id: user.id });
  }

  async updateBlockedUsers(user: RequestUserManager, words: string[]) {
    user.entity.blockedWords = words;
    user.entity.updatedAt = new Date();

    await this.db.getRepository(User).save(user.entity);

    return words;
  }

  async updateUserSettings(user: RequestUserManager, dto: EditUserDto, files: TEditProfileFiles) {
    const entity = user.entity;

    if (files?.avatar?.length) {
      entity.profilePicture = await this.convertSentProfilePictureAndGetFilename(files.avatar[0]);
    }
    if (files?.background?.length) {
      entity.bannerPicture = await this.convertSentBannerAndGetFilename(files.background[0]);
    }
    if (typeof dto.name !== 'undefined') {
      entity.name = dto.name;
    }
    if (typeof dto.slug !== 'undefined') {
      entity.slug = dto.slug;
    }
    if (typeof dto.askMeMessage !== 'undefined') {
      entity.askMeMessage = dto.askMeMessage;
    }
    if (typeof dto.allowAnonymousQuestions !== 'undefined') {
      entity.allowAnonymousQuestions = dto.allowAnonymousQuestions;
    }
    if (typeof dto.sendQuestionsToTwitterByDefault !== 'undefined') {
      entity.sendQuestionsToTwitterByDefault = dto.sendQuestionsToTwitterByDefault;
    }
    if (typeof dto.allowQuestionOfTheDay !== 'undefined') {
      entity.allowQuestionOfTheDay = dto.allowQuestionOfTheDay;
    }
    if (typeof dto.safeMode !== 'undefined') {
      entity.safeMode = dto.safeMode;
    }
    if (typeof dto.safeMode !== 'undefined') {
      entity.visible = dto.visible;
    }
    if (typeof dto.dropQuestionsOnBlockedWord !== 'undefined') {
      entity.dropQuestionsOnBlockedWord = dto.dropQuestionsOnBlockedWord;
    }

    entity.updatedAt = new Date();

    await this.db.getRepository(User).save(entity);

    return this.getLoggedUser(user);
  }

  private async convertSentProfilePictureAndGetFilename(file: Express.Multer.File) {
    try {
      const { link } = await this.mediasService.getConvertedImageFile(file, config.UPLOAD.PROFILE_PICTURES, { fixed: [250, 250] });

      // Picture is already moved at the right emplacement, do nothing else
      return link;
    } catch (e) {
      Logger.error('Unable to change Profile Picture: ' + e.stack);
      throw ErrorService.throw(EApiError.InvalidSentProfilePicture);
    }
  }

  private async convertSentBannerAndGetFilename(file: Express.Multer.File) {
    try {
      const { link } = await this.mediasService.getConvertedImageFile(file, config.UPLOAD.BANNERS, { fixed: [1500, 500] });

      // Picture is already moved at the right emplacement, do nothing else
      return link;
    } catch (e) {
      Logger.error('Unable to change Banner: ' + e.stack);
      throw ErrorService.throw(EApiError.InvalidSentProfilePicture);
    }
  }

  private async getUserFromEntity(loggedUser: RequestUserManager | undefined, targetUser: User) {
    if (loggedUser) {
      await this.blockSharedService.ensureUserCanSeeTarget(loggedUser, targetUser.id);
    }

    return this.sendableService.getSendableUser(targetUser, {
      context: loggedUser?.entity,
      withCounts: true,
      withPinnedQuestions: true,
      withRelationships: loggedUser?.hasRight(EApplicationRight.ReadRelationship),
    });
  }
}
