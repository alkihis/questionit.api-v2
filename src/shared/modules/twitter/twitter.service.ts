import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { User } from '../../../database/entities/user.entity';
import { ErrorService } from '../errors/error.service';
import { EApiError } from '../errors/error.enum';
import { TwitterApi } from 'twitter-api-v2';
import config from '../../config/config';
import { v4 as uuid } from 'uuid';
import fs, { createWriteStream } from 'fs';
import * as https from 'https';
import { MediasService } from '../medias/medias.service';

@Injectable()
export class TwitterService {
  constructor(
    @InjectConnection() private db: Connection,
    private mediasService: MediasService,
  ) {}

  getLoginClient() {
    return new TwitterApi({
      appKey: config.TWITTER.CONSUMER_KEY,
      appSecret: config.TWITTER.CONSUMER_SECRET,
    });
  }

  getLoginVerifierClient(oauthToken: string, oauthTokenSecret: string) {
    return new TwitterApi({
      appKey: config.TWITTER.CONSUMER_KEY,
      appSecret: config.TWITTER.CONSUMER_SECRET,
      accessToken: oauthToken,
      accessSecret: oauthTokenSecret,
    });
  }

  getClientForUser(user: User) {
    return new TwitterApi({
      appKey: config.TWITTER.CONSUMER_KEY,
      appSecret: config.TWITTER.CONSUMER_SECRET,
      accessToken: user.twitterOAuthToken,
      accessSecret: user.twitterOAuthSecret,
    });
  }

  async refreshProfilePicturesFromTwitter(user: User) {
    if (!user.twitterOAuthSecret) {
      throw ErrorService.throw(EApiError.InvalidTwitterCredentials);
    }

    const oldUser = { ...user };
    const client = this.getClientForUser(user);

    const twitterUser = await ErrorService.fulfillOrHttpException(client.currentUser(), EApiError.InvalidTwitterCredentials);

    const img = twitterUser.profile_image_url_https?.replace('_normal', '') ?? null;
    const banner = twitterUser.profile_banner_url ?? null;

    user.profilePicture = null;
    user.bannerPicture = null;

    try {
      // Download the images
      if (img) {
        user.profilePicture = await this.saveFileFromUrl(config.UPLOAD.PROFILE_PICTURES, img);
      }
      if (banner) {
        user.bannerPicture = await this.saveFileFromUrl(config.UPLOAD.BANNERS, img);
      }
    } catch {
      // The tokens seems to be invalids...
      throw ErrorService.throw(EApiError.InvalidTwitterCredentials);
    }

    await this.mediasService.cleanUserOldProfilePictures(oldUser);

    return this.db.getRepository(User).save(user);
  }

  private async saveTwitterFile(destination: string, file: NodeJS.ReadableStream, contentType: string) {
    const filename = uuid() + (contentType === 'image/png' ? '.png' : '.jpg');
    const dest = destination + '/' + filename;

    await new Promise((resolve, reject) => {
      const write = createWriteStream(dest);

      write.on('close', resolve);
      write.on('error', reject);

      file.pipe(write);
    });

    return filename;
  }

  private saveFileFromUrl(destination: string, url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      https.get(url, res => {
        if (res.statusCode === 200 || res.statusCode === 304) {
          this.saveTwitterFile(destination, res, res.headers["content-type"])
            .then(resolve)
            .catch(reject);
        }
        else {
          reject();
        }
      });
    });
  }
}
