import { createDirectoryTree } from '../shared/utils/fs.utils';
import config from '../shared/config/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from '../app/app.module';
import { ErrorFilter } from '../shared/filters/exception.filter';

export async function bootstrap() {
  // Auto create needed application folders
  createDirectoryTree(config.UPLOAD.PROFILE_PICTURES);
  createDirectoryTree(config.UPLOAD.BANNERS);
  createDirectoryTree(config.UPLOAD.ANSWER_PICTURES);
  createDirectoryTree(config.UPLOAD.TEMPORARY);
  createDirectoryTree(config.UPLOAD.FILE_PROCESSING);

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.set('trust proxy', 1);

  app.useGlobalFilters(new ErrorFilter());

  await app.listen(5000);
}

bootstrap();

process.on('unhandledRejection', reason => {
  console.error('Catched promise with reason:', reason);
});
