import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import config from '../config/config';
import { EApiError } from '../modules/errors/error.enum';
import { ErrorService } from '../modules/errors/error.service';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { RequestUserManager } from '../managers/request.user.manager';
import { Token } from '../../database/entities/token.entity';
import { QuestionItApplication } from '../../database/entities/questionit.application.entity';
import { Request } from 'express';
import { User } from '../../database/entities/user.entity';
import { INTERNAL_APPLICATION_RIGHT } from '../../database/enums/questionit.application.enum';
import { BannedIpGuard } from '../guards/banned.ip.guard';

export interface IJwt {
  userId: string;
  appId?: string;
  appKey?: string;
  rights?: string;
}

export interface IFullJwt extends IJwt {
  exp: number;
  iat: number;
  jti: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @InjectConnection() private db: Connection,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.JWT.SECRET,
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: IFullJwt) : Promise<RequestUserManager> {
    if (!payload.userId) {
      throw ErrorService.throw(EApiError.InvalidExpiredToken, { reason: 'No user ID' });
    }

    // Verify if token exists
    const entity = await this.db.getRepository(Token)
      .findOne({ jti: payload.jti });

    if (!entity) {
      throw ErrorService.throw(EApiError.InvalidExpiredToken, { reason: 'Token not found' });
    }

    if (entity.appId) {
      const key = payload.appKey;
      if (!key) {
        throw ErrorService.throw(EApiError.InvalidExpiredToken);
      }

      // Check if app exists
      const app = await this.db.getRepository(QuestionItApplication).findOne({ id: entity.appId });

      if (!app || app.key !== key) {
        // App deleted or invalid app key
        await this.db.getRepository(Token).delete({ id: entity.id });
        throw ErrorService.throw(EApiError.InvalidExpiredToken);
      }
    }

    const loginIp = request.ips?.join(',') || request.ip;
    entity.lastLoginAt = new Date();
    entity.lastIp = loginIp;

    await this.db.getRepository(Token)
      .update({ id: entity.id }, { lastIp: loginIp, lastLoginAt: new Date() });

    // Verify if user exists
    const user = await this.db.getRepository(User).findOne({ id: Number(payload.userId) || -1 });

    if (!user) {
      throw ErrorService.throw(EApiError.UserNotFound, { reason: 'User not found' });
    }

    if (BannedIpGuard.isTwitterIdBanned(user.twitterId) || BannedIpGuard.isUserAccountBanned(user.id)) {
      throw ErrorService.throw(EApiError.BannedUser);
    }

    const rights = payload.appId ? Number(payload.rights) : INTERNAL_APPLICATION_RIGHT;

    return new RequestUserManager(user, {
      tokenId: payload.jti,
      expires: payload.exp,
      emission: payload.iat,
      applicationId: payload.appId || null,
      rights,
      loginIp,
    });
  }
}
