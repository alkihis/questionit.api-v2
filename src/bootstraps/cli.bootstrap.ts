import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { CliSingleModule } from '../shared/modules/cli/cli.single.module';

export async function cliBootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(CliSingleModule);
  app.set('trust proxy', 1);

  await app.listen(9999);
}

cliBootstrap();

process.on('unhandledRejection', reason => {
  console.error('Catched promise with reason:', reason);
});
