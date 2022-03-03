import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseConfigService } from '../database/database.config.service';
import { OLD_DB_CONFIG } from './old.db.config';
import { legacyConnectionName } from './v1.migration.utils';
import { V1MigrationMainService } from './service/v1.migration.main.service';
import { V1MigrationController } from './v1.migration.controller';
import { V1MigrationUserService } from './service/v1.migration.user.service';
import { V1MigrationQuestionService } from './service/v1.migration.question.service';
import { V1MigrationRelationshipService } from './service/v1.migration.relationship.service';
import { V1MigrationBlocksService } from './service/v1.migration.blocks.service';
import { V1MigrationLikeService } from './service/v1.migration.like.service';
import { V1MigrationPushMessageService } from './service/v1.migration.push.message.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({ ...DatabaseConfigService.getConfig(), logging: ['error'], logger: 'simple-console', maxQueryExecutionTime: 2000 }),
    TypeOrmModule.forRoot({ ...OLD_DB_CONFIG, name: legacyConnectionName, logging: ['error'] }),
  ],
  controllers: [V1MigrationController],
  providers: [
    V1MigrationUserService,
    V1MigrationRelationshipService,
    V1MigrationBlocksService,
    V1MigrationQuestionService,
    V1MigrationLikeService,
    V1MigrationPushMessageService,
    V1MigrationMainService,
  ],
  exports: [],
})
export class V1MigrationModule {}
