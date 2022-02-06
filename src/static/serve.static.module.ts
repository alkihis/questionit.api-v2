import { ServeStaticModule } from '@nestjs/serve-static';
import config from '../shared/config/config';

export const serveStaticModule = ServeStaticModule.forRoot(
  {
    rootPath: config.UPLOAD.PROFILE_PICTURES,
    serveRoot: '/user/profile',
  },
  {
    rootPath: config.UPLOAD.BANNERS,
    serveRoot: '/user/banner',
  },
  {
    rootPath: config.UPLOAD.ANSWER_PICTURES,
    serveRoot: '/question/answer/media',
  },
);
