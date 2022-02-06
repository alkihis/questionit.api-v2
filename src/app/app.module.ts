import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import config from '../shared/config/config';
import { DB_CONFIG } from '../database/config';
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

const featureModules = [
  UserModule,
  TokenModule,
  RelationshipModule,
  NotificationModule,
  ApplicationModule,
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
    TypeOrmModule.forRoot(DB_CONFIG),
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
export class AppModule {}
