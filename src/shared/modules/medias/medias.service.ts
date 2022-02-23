import { Injectable } from '@nestjs/common';
import { User } from '../../../database/entities/user.entity';
import fs from 'fs';
import config from '../../config/config';
import fileType, { FileTypeResult } from 'file-type';
import { ErrorService } from '../errors/error.service';
import { EApiError } from '../errors/error.enum';
import { ImageConvertorManager } from '../../managers/image-convertor/image.convertor.manager';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { TImageDimensions } from '../../managers/image-convertor/image.convertor.interface';
import { EImageType } from '../sendable/sendable.shared.service';

export interface IConvertedImageFilePars {
  file: Express.Multer.File;
  mimeTypeCheck: (type: FileTypeResult) => boolean;
  fileSizeCheck: (size: number, type: FileTypeResult) => boolean,
  destination: string;
  dimensions: TImageDimensions;
}

@Injectable()
export class MediasService {
  /**
   * From a file, convert and crop, then save to disk at the right emplacement.
   * Returns filepath, destination, and filename to insert in user entity.
   */
  async getConvertedImageFile({ file, mimeTypeCheck, fileSizeCheck, destination, dimensions }: IConvertedImageFilePars) {
    // Get mimetype
    const type = await fileType.fromFile(file.path);

    if (!type || !mimeTypeCheck(type)) {
      throw ErrorService.throw(EApiError.InvalidSentFile);
    }
    if (!fileSizeCheck(file.size, type)) {
      throw ErrorService.throw(EApiError.InvalidSentFile);
    }

    const onEnd = await ImageConvertorManager.convert(file.path, dimensions, type.mime);

    if (onEnd.status === 'error') {
      throw ErrorService.throw(EApiError.InvalidSentFile);
    }

    const filename = uuid() + '.' + type.ext;
    const destinationName = destination + '/' + filename;

    // Move to destination
    await fs.promises.rename(onEnd.path, destinationName);

    // Return the API path of the file (local to QuestionIt)
    return {
      original: file.path,
      destination: destinationName,
      link: filename,
      mimeType: type.mime,
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

  getImagePublicUrl(url: string | undefined, type: EImageType) {
    if (!url) {
      return null;
    }

    if (type === EImageType.Profile) {
      return config.URL + '/user/profile/' + url;
    } else if (type === EImageType.Banner) {
      return config.URL + '/user/banner/' + url;
    } else if (type === EImageType.Answer) {
      return config.URL + '/question/answer/media/' + url;
    }
    return null;
  }
}
