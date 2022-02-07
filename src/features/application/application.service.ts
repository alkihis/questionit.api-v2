import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { ErrorService } from '../../shared/modules/errors/error.service';
import { ApplicationToken } from '../../database/entities/application.token.entity';
import { EApiError } from '../../shared/modules/errors/error.enum';
import { isAppTokenExpired } from '../../shared/utils/application.token.utils';
import { getRightsAsObject, getRightsFromBody } from '../../shared/utils/rights.utils';
import { ApproveAppDto, CreateApplicationDto, CreateAppTokenDto } from './application.dto';
import { QuestionItApplication } from '../../database/entities/questionit.application.entity';
import crypto from 'crypto';
import CryptoJS from 'crypto-js';
import RandomJS from 'random-js';
import urlSafeBase64 from 'urlsafe-base64';
import { IRequestTokenData } from '../../database/interfaces/token.interface';
import config from '../../shared/config/config';
import { RequestUserManager } from '../../shared/managers/request.user.manager';
import { Token } from '../../database/entities/token.entity';
import { SendableSharedService } from '../../shared/modules/sendable/sendable.shared.service';

@Injectable()
export class ApplicationService {
  constructor(
    @InjectConnection() private db: Connection,
    private sendableService: SendableSharedService,
  ) {}

  async getTokenDetails(token: string) {
    const appToken = await ErrorService.fulfillOrHttpException(
      this.db.getRepository(ApplicationToken)
        .createQueryBuilder('apptoken')
        .where('apptoken.token = :token', { token })
        .innerJoin('apptoken.application', 'app')
        .getOneOrFail(),
      EApiError.InvalidExpiredToken,
    );

    this.ensureAppTokenIsUnlinkedAndUsable(appToken);

    return {
      emitter: appToken.application.name,
      emittedAt: appToken.createdAt.toISOString(),
      rights: getRightsAsObject(Number(appToken.application.defaultRights)),
    }
  }

  async createAppToken(dto: CreateAppTokenDto) {
    const application = await ErrorService.fulfillOrHttpException(
      this.db.getRepository(QuestionItApplication).findOneOrFail({ key: dto.key }),
      EApiError.ApplicationNotFound,
    );

    const token = await this.getFreshAppToken(application, dto);
    return { token: token.token };
  }

  async approveTokenForApplication(user: RequestUserManager, body: ApproveAppDto) {
    if (body.token && body.deny) {
      throw ErrorService.throw(EApiError.InvalidParameter);
    }

    const applicationToken = await ErrorService.fulfillOrHttpException(
      this.db.getRepository(ApplicationToken).findOneOrFail({ where: { token: body.token || body.deny } }),
      EApiError.InvalidExpiredToken,
    );

    this.ensureAppTokenIsUnlinkedAndUsable(applicationToken);

    if (body.deny) {
      return await this.denyToken(applicationToken);
    }
    return await this.approveTokenForUser(user, applicationToken);
  }

  async listApplications(user: RequestUserManager) {
    return this.sendableService.getSendableApplications(
      await this.db.getRepository(QuestionItApplication).find({ where: { ownerId: user.id } }),
    );
  }

  async createApplication(user: RequestUserManager, body: CreateApplicationDto) {
    const appCount = await this.db.getRepository(QuestionItApplication).count({ where: { ownerId: user.id } });

    if (appCount >= config.LIMITS.APPS_PER_USER) {
      throw ErrorService.throw(EApiError.TooManyApplications);
    }

    const hasSameApp = await this.db.getRepository(QuestionItApplication)
      .createQueryBuilder('app')
      .where('app.ownerId = :userId', { userId: user.id })
      .andWhere('lower(app.name) = lower(:name)', { name: body.name })
      .getCount();

    if (hasSameApp) {
      throw ErrorService.throw(EApiError.SameAppName);
    }

    // Create app
    const application = this.db.getRepository(QuestionItApplication).create({
      key: this.getFreshTokenId(),
      name: body.name,
      ownerId: user.id,
      defaultRights: getRightsFromBody(body.rights).toString(),
      url: body.url,
    });

    await this.db.getRepository(QuestionItApplication).save(application);

    return this.sendableService.getSendableApplication(application);
  }

  async editApplication(user: RequestUserManager, appId: number, body: CreateApplicationDto) {
    const application = await ErrorService.fulfillOrHttpException(
      this.db.getRepository(QuestionItApplication).findOneOrFail({ where: { ownerId: user.id, id: appId } }),
      EApiError.ApplicationNotFound,
    );

    const hasSameAppWithNewName = await this.db.getRepository(QuestionItApplication)
      .createQueryBuilder('app')
      .where('app.ownerId = :userId', { userId: user.id })
      .andWhere('lower(app.name) = lower(:name)', { name: body.name })
      .andWhere('app.id != :appId', { appId })
      .getCount();

    if (hasSameAppWithNewName) {
      throw ErrorService.throw(EApiError.SameAppName);
    }

    // Modify app
    application.name = body.name;
    application.url = body.url;
    application.defaultRights = getRightsFromBody(body.rights).toString();

    await this.db.getRepository(QuestionItApplication).save(application);

    return this.sendableService.getSendableApplication(application);
  }

  async regenerateApplicationKey(user: RequestUserManager, appId: number) {
    const application = await ErrorService.fulfillOrHttpException(
      this.db.getRepository(QuestionItApplication).findOneOrFail({ where: { id: appId, ownerId: user.id } }),
      EApiError.ApplicationNotFound,
    );

    application.key = this.getFreshTokenId();
    await this.db.getRepository(QuestionItApplication).save(application);

    return this.sendableService.getSendableApplication(application);
  }

  async deleteApplication(user: RequestUserManager, appId: number) {
    await ErrorService.fulfillOrHttpException(
      this.db.getRepository(QuestionItApplication).findOneOrFail({ where: { id: appId, ownerId: user.id } }),
      EApiError.ApplicationNotFound,
    );

    await this.db.getRepository(ApplicationToken).delete({ applicationId: appId });
    await this.db.getRepository(Token).delete({ appId: appId });
    await this.db.getRepository(QuestionItApplication).delete({ id: appId });
  }

  async listActiveApplicationsFromTokens(user: RequestUserManager) {
    const openTokens = await this.db.getRepository(Token)
      .createQueryBuilder('token')
      .innerJoinAndSelect('token.application', 'app')
      .where('token.ownerId = :userId', { userId: user.id })
      .getMany();

    const uniqueTokenByApp: Map<number, Token> = new Map();

    for (const openToken of openTokens) {
      uniqueTokenByApp.set(openToken.appId, openToken);
    }

    return [...uniqueTokenByApp.values()]
      .map(token => this.sendableService.getSendableApplicationFromToken(token));
  }

  async deleteApplicationSubscription(user: RequestUserManager, appId: number) {
    await this.db.getRepository(Token).delete({ ownerId: user.id, appId });
  }

  private async approveTokenForUser(user: RequestUserManager, applicationToken: ApplicationToken) {
    const appTokenRepository = this.db.getRepository(ApplicationToken);
    applicationToken.ownerId = user.id;

    // Create a validator
    if (applicationToken.redirectTo !== 'oob') {
      applicationToken.validator = this.getFreshTokenId();
      await appTokenRepository.save(applicationToken);

      const url = new URL(applicationToken.redirectTo);
      url.searchParams.append('validator', applicationToken.validator);

      return { validator: applicationToken.validator, url: url.toString() };
    }

    // Generate a pin
    const generator = new RandomJS.Random(RandomJS.MersenneTwister19937.autoSeed());
    const pin = generator.integer(100000, 999999);

    applicationToken.validator = String(pin);
    await appTokenRepository.save(applicationToken);

    return { pin: applicationToken.validator };
  }

  private async denyToken(applicationToken: ApplicationToken) {
    await this.db.getRepository(ApplicationToken).delete({ id: applicationToken.id });

    if (applicationToken.redirectTo !== 'oob') {
      const url = new URL(applicationToken.redirectTo);
      url.searchParams.append('denied', applicationToken.token);

      return { denied: url.toString() };
    }

    return { denied: true };
  }

  private ensureAppTokenIsUnlinkedAndUsable(appToken: ApplicationToken) {
    if (appToken.ownerId) {
      throw ErrorService.throw(EApiError.TokenAlreadyApproved);
    }
    if (isAppTokenExpired(appToken.createdAt)) {
      throw ErrorService.throw(EApiError.InvalidExpiredToken);
    }
  }

  private async getFreshAppToken(application: QuestionItApplication, dto: CreateAppTokenDto) {
    const appTokenRepository = this.db.getRepository(ApplicationToken);
    const defaultRights = Number(application.defaultRights);
    const tokenId = this.getFreshTokenId();
    const tokenRights = dto.rights
      ? getRightsFromBody(dto.rights, defaultRights)
      : defaultRights;

    const encodedTokenData = CryptoJS.AES.encrypt(
      JSON.stringify({ id: tokenId, rights: tokenRights } as IRequestTokenData),
      config.JWT.SECRET,
    );

    const applicationToken = appTokenRepository.create({
      applicationId: application.id,
      token: encodedTokenData.toString(),
      redirectTo: dto.url,
    });

    return await appTokenRepository.save(applicationToken);
  }

  private getFreshTokenId() {
    return urlSafeBase64.encode(crypto.randomBytes(16));
  }
}
