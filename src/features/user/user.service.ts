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
import { updateEntityValuesIfDefined } from '../../shared/utils/entity.utils';
import { RequestContextService } from '../../shared/modules/context/request.context.service';

export type TEditProfileFiles = { [K in 'avatar' | 'background']: Express.Multer.File[] };

@Injectable()
export class UserService {
  constructor(
    @InjectConnection() private db: Connection,
    private sendableService: SendableSharedService,
    private blockSharedService: BlockSharedService,
    private twitterService: TwitterService,
    private mediasService: MediasService,
    private requestContextService: RequestContextService,
  ) {}

  async getLoggedUser() {
    const user = this.requestContextService.user;

    return this.sendableService.getSendableUser(user.entity, {
      context: user.entity,
      withCounts: true,
      withPinnedQuestions: true,
      withUserOptions: true,
      withRelationships: user.hasRight(EApplicationRight.ReadRelationship),
    });
  }

  async getUserById(id: number) {
    const user = this.requestContextService.user;
    const targetUser = await ErrorService.fulfillOrHttpException(this.db.getRepository(User).findOneOrFail({ id }), EApiError.UserNotFound);
    return await this.getUserFromEntity(user, targetUser);
  }

  async getUserBySlug(slug: string) {
    const user = this.requestContextService.user;

    const targetUser = await ErrorService.fulfillOrHttpException(
      this.db.getRepository(User)
        .createQueryBuilder('user')
        .where('lower(user.slug) = lower(:slug)', { slug })
        .getOneOrFail(),
      EApiError.UserNotFound,
    );
    return await this.getUserFromEntity(user, targetUser);
  }

  async searchUsers(query: SearchUserDto) {
    const user = this.requestContextService.user;

    return await paginateWithIds({
      paginationDto: query,
      qb: this.db.getRepository(User)
        .createQueryBuilder('user')
        .where(`(${getUnaccentQuery('user.slug')} OR ${getUnaccentQuery('user.name')})`, { query: query.q })
        .andWhere('user.visible = TRUE'),
      convertItems: items => this.sendableService.getSendableUsers(items, {
        context: user?.entity,
        withCounts: true,
        withPinnedQuestions: true,
        withRelationships: user?.hasRight(EApplicationRight.ReadRelationship),
      }),
    });
  }

  async isSlugAvailable(slug: string) {
    const user = this.requestContextService.user;

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

  async syncProfileWithTwitter() {
    const user = this.requestContextService.user;

    user.entity = await this.twitterService.refreshProfilePicturesFromTwitter(user.entity);
    user.entity.updatedAt = new Date();

    return await this.getLoggedUser();
  }

  async deleteAccount() {
    await this.db.getRepository(User).delete({ id: this.requestContextService.user.id });
  }

  async updateBlockedUsers(words: string[]) {
    const user = this.requestContextService.user;

    user.entity.blockedWords = words;
    user.entity.updatedAt = new Date();

    await this.db.getRepository(User).save(user.entity);

    return words;
  }

  async updateUserSettings(dto: EditUserDto, files: TEditProfileFiles) {
    const user = this.requestContextService.user;
    const entity = user.entity;

    if (files?.avatar?.length) {
      entity.profilePicture = await this.convertSentProfilePictureAndGetFilename(files.avatar[0]);
    }
    if (files?.background?.length) {
      entity.bannerPicture = await this.convertSentBannerAndGetFilename(files.background[0]);
    }

    updateEntityValuesIfDefined(entity, {
      name: dto.name,
      slug: dto.slug,
      askMeMessage: dto.askMeMessage,
      allowAnonymousQuestions: dto.allowAnonymousQuestions,
      sendQuestionsToTwitterByDefault: dto.sendQuestionsToTwitterByDefault,
      allowQuestionOfTheDay: dto.allowQuestionOfTheDay,
      safeMode: dto.safeMode,
      visible: dto.visible,
      dropQuestionsOnBlockedWord: dto.dropQuestionsOnBlockedWord,
      useRocketEmojiInQuestions: dto.useRocketEmojiInQuestions,
      useHashtagInQuestions: dto.useHashtagInQuestions || null,
    });

    entity.updatedAt = new Date();

    await this.db.getRepository(User).save(entity);

    return this.getLoggedUser();
  }

  private async convertSentProfilePictureAndGetFilename(file: Express.Multer.File) {
    try {
      const { link } = await this.mediasService.getConvertedImageFile({
        file,
        mimeTypeCheck: type => type.mime === 'image/jpeg' || type.mime === 'image/png',
        fileSizeCheck: size => size <= config.LIMITS.FILE_SIZE,
        destination: config.UPLOAD.PROFILE_PICTURES,
        dimensions: { fixed: [250, 250] },
      });

      // Picture is already moved at the right emplacement, do nothing else
      return link;
    } catch (e) {
      Logger.error('Unable to change Profile Picture: ' + e.stack);
      throw ErrorService.throw(EApiError.InvalidSentProfilePicture);
    }
  }

  private async convertSentBannerAndGetFilename(file: Express.Multer.File) {
    try {
      const { link } = await this.mediasService.getConvertedImageFile({
        file,
        mimeTypeCheck: type => type.mime === 'image/jpeg' || type.mime === 'image/png',
        fileSizeCheck: size => size <= config.LIMITS.FILE_SIZE,
        destination: config.UPLOAD.BANNERS,
        dimensions: { fixed: [1500, 500] },
      });

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
