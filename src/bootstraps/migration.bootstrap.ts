import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { V1MigrationModule } from '../v1-migration/v1.migration.module';

export async function migrationBootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(V1MigrationModule);
  app.set('trust proxy', 1);

  await app.listen(9999);
}

migrationBootstrap();

process.on('unhandledRejection', reason => {
  console.error('Catched promise with reason:', reason);
});
