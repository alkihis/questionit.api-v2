import { MiddlewareConsumer, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import config from '../shared/config/config';
import { GlobalSharedModule } from '../shared/modules/global.shared.module';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';
import { RedisService } from '../shared/modules/redis/redis.service';
import { JwtStrategy } from '../shared/strategies/jwt.stategy';
import { QueueModule } from '../shared/queues/queue.module';
import { BannedIpGuard } from '../shared/guards/banned.ip.guard';
import { UserModule } from '../features/user/user.module';
import { TokenModule } from '../features/token/token.module';
import { RelationshipModule } from '../features/relationship/relationship.module';
import { NotificationModule } from '../features/notification/notification.module';
import { serveStaticModule } from '../static/serve.static.module';
import { ApplicationModule } from '../features/application/application.module';
import { BlockModule } from '../features/block/block.module';
import { LikeModule } from '../features/like/like.module';
import { PollModule } from '../features/poll/poll.module';
import { PushModule } from '../features/push/push.module';
import { QuestionModule } from '../features/question/question.module';
import { RequestContextMiddleware } from '../shared/modules/context/request.context.middleware';
import { DatabaseConfigService } from '../database/database.config.service';
import { ServerTimingMiddleware } from '../shared/middlewares/server-timing/server.timing.middleware';

const featureModules = [
  UserModule,
  TokenModule,
  RelationshipModule,
  NotificationModule,
  ApplicationModule,
  BlockModule,
  LikeModule,
  PollModule,
  PushModule,
  QuestionModule,
];

@Module({
  imports: [
    serveStaticModule,
    // Rate limit
    ThrottlerModule.forRoot({
      ttl: config.RATE_LIMITING.DEFAULT_TTL,
      limit: config.RATE_LIMITING.DEFAULT_LIMIT,
      storage: new ThrottlerStorageRedisService(RedisService.client),
    }),
    // Database
    TypeOrmModule.forRoot(DatabaseConfigService.getConfig()),
    // Auth / JWT boilerplate
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // Cron Jobs
    QueueModule,
    GlobalSharedModule,
    // Features
    ...featureModules,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: BannedIpGuard,
    },
    JwtStrategy,
    AppService,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');

    if (config.ENV_IS.DEV) {
      consumer.apply(ServerTimingMiddleware).forRoutes('*');
    }
  }
}
