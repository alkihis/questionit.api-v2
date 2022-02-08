import { Process, Processor, OnQueueCompleted } from '@nestjs/bull';
import { EQueueCronName } from '../../queue.enum';
import { Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import fs from 'fs';
import config from '../../../config/config';
import path from 'path';
import { User } from '../../../../database/entities/user.entity';
import { Answer } from '../../../../database/entities/answer.entity';

const emptyErrorFn = () => {};

@Processor(EQueueCronName.MediasCleaning)
export class MediaCleaningQueueConsumer {
  constructor(
    @InjectConnection() private db: Connection,
  ) {}

  @Process()
  async process() {
    Logger.log(`Starting media cleaning.`);

    await Promise.all([
      this.cleanTemporaryFiles(),
      this.cleanOldConvertedFiles(),
      this.cleanOldProfilePictures(),
      this.cleanOldBannerPictures(),
      this.cleanOldAnswerPictures(),
    ]);
  }

  @OnQueueCompleted()
  completed(payload: any) {
    Logger.log(`Media cleaning completed.`);
  }

  private async cleanTemporaryFiles() {
    const expirationDelay = 1000 * 60 * 5; // 5 minutes
    const files = await fs.promises.readdir(config.UPLOAD.TEMPORARY);

    for (const filename of files) {
      const fullPath = path.resolve(config.UPLOAD.TEMPORARY, filename);
      const stat = await fs.promises.stat(fullPath);

      if (stat.ctimeMs + expirationDelay < Date.now()) {
        Logger.log(`Cron: Deleting temporary file ${filename}`);
        fs.promises.unlink(fullPath).catch(emptyErrorFn);
      }
    }
  }

  private async cleanOldConvertedFiles() {
    const expirationDelay = 1000 * 60 * 30; // 30 minutes
    const files = await fs.promises.readdir(config.UPLOAD.FILE_PROCESSING);

    for (const filename of files) {
      const fullPath = path.resolve(config.UPLOAD.FILE_PROCESSING, filename);
      const stat = await fs.promises.stat(fullPath);

      if (stat.ctimeMs + expirationDelay < Date.now()) {
        Logger.log(`Cron: Deleting bungling convert file ${filename}`);
        fs.promises.unlink(fullPath).catch(emptyErrorFn);
      }
    }
  }

  private async cleanOldProfilePictures() {
    const expirationDelayTolerence = 1000 * 60; // 1 minute
    const files = await fs.promises.readdir(config.UPLOAD.PROFILE_PICTURES);

    if (!files.length) {
      return;
    }

    const validFiles = (await this.db.getRepository(User).createQueryBuilder('user')
      .where('user.profilePicture IS NOT NULL')
      .select(['user.profilePicture', 'user.id'])
      .getMany())
        .map(u => u.profilePicture);

    const knownFiles = new Set(validFiles);

    for (const filename of files) {
      if (knownFiles.has(filename)) {
        return;
      }

      const fullPath = path.resolve(config.UPLOAD.PROFILE_PICTURES, filename);
      const stat = await fs.promises.stat(fullPath);

      if (stat.ctimeMs + expirationDelayTolerence < Date.now()) {
        Logger.log(`Cron: Deleting unlinked profile picture file ${filename}`);
        fs.promises.unlink(fullPath).catch(emptyErrorFn);
      }
    }
  }

  private async cleanOldBannerPictures() {
    const expirationDelayTolerence = 1000 * 60; // 1 minute
    const files = await fs.promises.readdir(config.UPLOAD.BANNERS);

    if (!files.length) {
      return;
    }

    const validFiles = (await this.db.getRepository(User).createQueryBuilder('user')
      .where('user.bannerPicture IS NOT NULL')
      .select(['user.bannerPicture', 'user.id'])
      .getMany())
      .map(u => u.bannerPicture);

    const knownFiles = new Set(validFiles);

    for (const filename of files) {
      if (knownFiles.has(filename)) {
        return;
      }

      const fullPath = path.resolve(config.UPLOAD.BANNERS, filename);
      const stat = await fs.promises.stat(fullPath);

      if (stat.ctimeMs + expirationDelayTolerence < Date.now()) {
        Logger.log(`Cron: Deleting unlinked banner picture file ${filename}`);
        fs.promises.unlink(fullPath).catch(emptyErrorFn);
      }
    }
  }

  private async cleanOldAnswerPictures() {
    const expirationDelayTolerence = 1000 * 60; // 1 minute
    const files = await fs.promises.readdir(config.UPLOAD.ANSWER_PICTURES);

    if (!files.length) {
      return;
    }

    const validFiles = (await this.db.getRepository(Answer).createQueryBuilder('answer')
      .where('answer.linkedImage IS NOT NULL')
      .select(['answer.linkedImage', 'answer.id'])
      .getMany())
      .map(a => a.linkedImage);

    const knownFiles = new Set(validFiles);

    for (const filename of files) {
      if (knownFiles.has(filename)) {
        return;
      }

      const fullPath = path.resolve(config.UPLOAD.ANSWER_PICTURES, filename);
      const stat = await fs.promises.stat(fullPath);

      if (stat.ctimeMs + expirationDelayTolerence < Date.now()) {
        Logger.log(`Cron: Deleting unlinked answer picture file ${filename}`);
        fs.promises.unlink(fullPath).catch(emptyErrorFn);
      }
    }
  }
}
