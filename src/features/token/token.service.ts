import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { TwitterApi } from 'twitter-api-v2';
import config from '../../shared/config/config';
import { ErrorService } from '../../shared/modules/errors/error.service';
import { EApiError } from '../../shared/modules/errors/error.enum';
import { CreateTokenDto, GetAccessTokenDto } from './token.dto';
import { Request } from 'express';
import { User } from '../../database/entities/user.entity';
import { IClientTokenOauth } from 'twitter-api-v2/dist/types/client.types';
import { updateEntityValues } from '../../shared/utils/entity.utils';
import { v4 as uuid } from 'uuid';
import { IJwt } from '../../shared/strategies/jwt.stategy';
import { Token } from '../../database/entities/token.entity';
import { TwitterService } from '../../shared/modules/twitter/twitter.service';
import { SendableSharedService } from '../../shared/modules/sendable/sendable.shared.service';
import { RequestUserManager } from '../../shared/managers/request.user.manager';
import { EApplicationRight } from '../../database/enums/questionit.application.enum';
import { ApplicationToken } from '../../database/entities/application.token.entity';
import { QuestionItApplication } from '../../database/entities/questionit.application.entity';
import * as CryptoJS from 'crypto-js';
import { IRequestTokenData } from '../../database/interfaces/token.interface';
import { ERedisExpiration, ERedisPrefix, RedisService } from '../../shared/modules/redis/redis.service';
import { isAppTokenExpired } from '../../shared/utils/application.token.utils';
import { Timing } from '../../shared/utils/time.utils';
import { DateTime } from 'luxon';

@Injectable()
export class TokenService {
  constructor(
    @InjectConnection() private db: Connection,
    private readonly jwtService: JwtService,
    private readonly twitterService: TwitterService,
    private readonly sendableService: SendableSharedService,
  ) {}

  private static readonly internalTokenExpiration = Timing.days(31);
  private static readonly appTokenExpiration = Timing.hours(2);

  async getRequestToken() {
    const client = this.twitterService.getLoginClient();
    const { url, oauth_token, oauth_token_secret } = await client.generateAuthLink(config.TWITTER.CALLBACK_URL);

    if (!oauth_token) {
      throw ErrorService.throw(EApiError.InvalidTwitterCallbackKeys);
    }

    await RedisService.setObject(
      ERedisPrefix.TwitterOAuthSecret + oauth_token,
      { oauthTokenSecret: oauth_token_secret },
      ERedisExpiration.TwitterOAuthSecret,
    );

    return {
      oauthToken: oauth_token,
      url,
    };
  }

  async loginFromTwitter(req: Request, query: GetAccessTokenDto) {
    const userRepository = this.db.getRepository(User);

    const client = await this.getLoggedClientFromTemporaryTokens(query);
    const user = await this.createOrUpdateUserFromTwitter(client);

    const isNewUser = !user.id;
    await userRepository.save(user);

    if (isNewUser) {
      // Create pp for new users
      // Save twitter profile pictures
      await this.twitterService.refreshProfilePicturesFromTwitter(user);
    }

    // Generate the future JWTid
    const jwtid = uuid();

    // Generate a JWT
    const expiresIn = TokenService.internalTokenExpiration.asSeconds;
    const expiresAt = DateTime.utc().plus({ second: expiresIn }).toJSDate();

    const accessToken = await this.jwtService.signAsync({ userId: user.id.toString() } as IJwt, { jwtid, expiresIn });

    // Save the JWT in database
    const dbToken = this.db.getRepository(Token).create({
      ownerId: user.id,
      lastIp: req.ips?.join(',') || req.ip,
      openIp: req.ips?.join(',') || req.ip,
      lastLoginAt: new Date(),
      jti: jwtid,
      expiresAt,
    });

    await this.db.getRepository(Token).save(dbToken);

    // Send it
    return {
      token: accessToken,
      user: await this.sendableService.getSendableUser(user, {
        context: user,
        withRelationships: true,
        withUserOptions: true,
        withPinnedQuestions: true,
        withCounts: true,
      }),
      // Will be served from cache, no-op
      twitter: await client.currentUser(),
    };
  }

  async checkUserTokensValidity(user: RequestUserManager) {
    const client = this.twitterService.getClientForUser(user.entity);

    const twitterUser = await ErrorService.fulfillOrHttpException(client.currentUser(), EApiError.InvalidTwitterCredentials);
    const loggedUser = await this.sendableService.getSendableUser(user.entity, {
      context: user.entity,
      withCounts: true,
      withPinnedQuestions: true,
      withUserOptions: true,
      withRelationships: user.hasRight(EApplicationRight.ReadRelationship),
    });

    return {
      twitter: twitterUser,
      user: loggedUser,
      rights: user.getRights(),
    };
  }

  async createTokenForApplication(req: Request, dto: CreateTokenDto) {
    const { appToken, application } = await this.getAppAndTokenFromCreateTokenRequest(dto);
    const tokenData = await this.decodeAppTokenData(appToken.token);
    const user = await ErrorService.fulfillOrHttpException(
      this.db.getRepository(User).findOneOrFail({ id: appToken.ownerId }),
      EApiError.UserNotFound,
    );

    // Generate the future JWTid
    const jwtid = uuid();

    // Generate a JWT
    const expiresIn = TokenService.appTokenExpiration.asSeconds;
    const expiresAt = DateTime.utc().plus({ second: expiresIn }).toJSDate();

    const accessToken = await this.jwtService.signAsync({
      userId: appToken.ownerId.toString(),
      appId: appToken.applicationId.toString(),
      rights: tokenData.rights.toString(),
      appKey: application.key,
    } as IJwt, { jwtid, expiresIn });

    // Save the JWT in database
    const entity = this.db.getRepository(Token).create({
      jti: jwtid,
      rights: tokenData.rights.toString(),
      lastLoginAt: new Date(),
      ownerId: appToken.ownerId,
      appId: appToken.applicationId,
      openIp: req.ips?.join(',') || req.ip,
      expiresAt,
    });

    await this.db.getRepository(Token).save(entity);
    // Delete used app token
    await this.db.getRepository(ApplicationToken).delete({ id: appToken.id });

    // Send it
    return {
      token: accessToken,
      user: await this.sendableService.getSendableUser(user, {
        context: user,
        withRelationships: RequestUserManager.hasRight(tokenData.rights, EApplicationRight.ReadRelationship),
        withUserOptions: true,
        withPinnedQuestions: true,
        withCounts: true,
      }),
    };
  }

  async revokeToken(user: RequestUserManager, token: string) {
    if (!user.hasRight(EApplicationRight.InternalUseOnly) || !token) {
      // If does not have the right to use other tokens (or if token is not set)
      token = user.requestTokenInformation.tokenId;
    }

    const entity = await this.db.getRepository(Token).findOne({ jti: token });

    if (!entity) {
      throw ErrorService.throw(EApiError.ResourceNotFound, { missing: 'Requested token does not exists.' });
    }

    if (entity.ownerId !== user.id) {
      throw ErrorService.create(EApiError.Forbidden, { error: 'You are not the owner of this token.' });
    }

    await this.db.getRepository(Token).delete({ id: entity.id });

    Logger.debug('Revoked token: ' + entity.jti);
  }

  async listTokens(user: RequestUserManager) {
    const tokens = this.sendableService.getSendableTokens(await this.db.getRepository(Token).find({ ownerId: user.id }));
    const currentToken = tokens.find(t => t.jti === user.requestTokenInformation.tokenId);

    if (currentToken) {
      currentToken.current = true;
    }

    return tokens;
  }

  private async getLoggedClientFromTemporaryTokens(query: GetAccessTokenDto) {
    const savedTokensInRedis = await RedisService.getObject(ERedisPrefix.TwitterOAuthSecret + query.oauthToken) as { oauthTokenSecret: string };
    if (!savedTokensInRedis) {
      throw ErrorService.throw(EApiError.InvalidExpiredToken);
    } else {
      await RedisService.deleteObject(ERedisPrefix.TwitterOAuthSecret + query.oauthToken);
    }

    // First, get the access token using keys+verifier
    const client = this.twitterService.getLoginVerifierClient(query.oauthToken, savedTokensInRedis.oauthTokenSecret);

    try {
      const loginResult = await client.login(query.oauthVerifier);

      if (!loginResult.accessToken) {
        throw ErrorService.throw(EApiError.InvalidTwitterCallbackKeys);
      } else {
        return loginResult.client;
      }
    } catch {
      throw ErrorService.throw(EApiError.InvalidTwitterCallbackKeys);
    }
  }

  private async createOrUpdateUserFromTwitter(client: TwitterApi) {
    const { accessToken, accessSecret } = client.getActiveTokens() as IClientTokenOauth;

    // Get the twitter user object: Verify the credentials access
    const twitterUser = await ErrorService.fulfillOrHttpException(client.currentUser(), EApiError.InvalidTwitterCredentials);

    const userRepository = this.db.getRepository(User);
    let localUser = await userRepository.findOne({ twitterId: twitterUser.id_str });

    if (!localUser) {
      let slug = twitterUser.screen_name.slice(0, config.LIMITS.SLUG_LENGTH); // 20 chars
      if (slug.match(/^[0-9]+$/)) {
        // Only numbers in screen name: add a underscore to make it unique.
        slug = '_' + slug.slice(0, config.LIMITS.SLUG_LENGTH - 1);
      }

      // Check if the slug exists (searchs are made case-insensitive in mysql with utf8mb4 default collation)
      let matchingSlug = await userRepository.findOne({ slug });

      // Find a new slug that is not used
      while (matchingSlug) {
        slug = slug.slice(0, 10) + '_' + Math.random().toString().slice(2, 9);
        matchingSlug = await userRepository.findOne({ slug });
      }

      // Create the user
      return userRepository.create({
        name: twitterUser.name.slice(0, config.LIMITS.SLUG_LENGTH) || slug,
        slug,
        twitterId: twitterUser.id_str,
        twitterOAuthToken: accessToken,
        twitterOAuthSecret: accessSecret,
        profilePicture: null,
        bannerPicture: null,
        blockedWords: [],
      });
    }

    return updateEntityValues(localUser, {
      twitterOAuthToken: accessToken,
      twitterOAuthSecret: accessSecret,
    });
  }

  private async getAppAndTokenFromCreateTokenRequest(dto: CreateTokenDto) {
    const appToken = await this.db.getRepository(ApplicationToken)
      .findOne({ where: { token: dto.token } });
    const application = await this.db.getRepository(QuestionItApplication)
      .findOne({ where: { key: dto.key } });

    if (!appToken || !application) {
      throw ErrorService.throw(EApiError.InvalidExpiredToken);
    }
    if (appToken.applicationId !== application.id) {
      throw ErrorService.create(EApiError.InvalidExpiredToken);
    }
    // Check if token is expired (15 minutes max from now)
    if (isAppTokenExpired(appToken.createdAt)) {
      // Expired token
      throw ErrorService.create(EApiError.InvalidExpiredToken);
    }
    // Check if token is linked to an user
    if (!appToken.ownerId) {
      throw ErrorService.create(EApiError.TokenNotAffilated);
    }
    if (appToken.validator !== dto.validator) {
      throw ErrorService.create(EApiError.InvalidParameter);
    }

    return { appToken, application };
  }

  private async decodeAppTokenData(token: string) {
    try {
      const bytes = CryptoJS.AES.decrypt(token, config.JWT.SECRET);
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8)) as IRequestTokenData;
    } catch {
      // Modified or invalid token
      throw ErrorService.create(EApiError.InvalidExpiredToken);
    }
  }
}
