import { Injectable } from '@nestjs/common';
import { User } from '../../../database/entities/user.entity';
import fs from 'fs';
import config from '../../config/config';
import fileType from 'file-type';
import { ErrorService } from '../errors/error.service';
import { EApiError } from '../errors/error.enum';
import { ImageConvertorManager } from '../../managers/image-convertor/image.convertor.manager';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { TImageDimensions } from '../../managers/image-convertor/image.convertor.interface';

@Injectable()
export class MediasService {
  /**
   * From a file, convert and crop, then save to disk at the right emplacement.
   * Returns filepath, destination, and filename to insert in user entity.
   */
  async getConvertedImageFile(file: Express.Multer.File, destination: string, dimensions: TImageDimensions) {
    // Get mimetype
    const type = await fileType.fromFile(file.path);

    if (!type || !type.mime.startsWith('image/')) {
      throw ErrorService.throw(EApiError.InvalidSentFile);
    }
    if (type.mime !== 'image/jpeg' && type.mime !== 'image/png') {
      throw ErrorService.throw(EApiError.InvalidSentFile);
    }

    const onEnd = await ImageConvertorManager.convert(file.path, dimensions, type.mime);

    if (onEnd.status === 'error') {
      throw ErrorService.throw(EApiError.InvalidSentFile);
    }

    const parsedPath = path.parse(onEnd.path);
    const filename = uuid() + parsedPath.ext;
    const destinationName = destination + '/' + filename;

    // Move to destination
    await fs.promises.rename(onEnd.path, destinationName);

    // Return the API path of the file (local to QuestionIt)
    return {
      original: file.path,
      destination: destinationName,
      link: filename,
    };
  }

  /**
   * Delete the old banner and profile files from user
   */
  async cleanUserOldProfilePictures(user: User) {
    if (user.profilePicture) {
      await fs.promises.unlink(config.UPLOAD.PROFILE_PICTURES + '/' + user.profilePicture).catch(() => void 0);
    }
    if (user.bannerPicture) {
      await fs.promises.unlink(config.UPLOAD.BANNERS + '/' + user.bannerPicture).catch(() => void 0);
    }
  }
}
