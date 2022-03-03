import { Injectable, Logger } from '@nestjs/common';
import { V1MigrationUserService } from './v1.migration.user.service';
import { MigrationMappingContext, MigrationTransactionContext } from '../v1.migration.utils';
import { V1MigrationRelationshipService } from './v1.migration.relationship.service';
import { V1MigrationBlocksService } from './v1.migration.blocks.service';
import { V1MigrationQuestionService } from './v1.migration.question.service';
import { V1MigrationLikeService } from './v1.migration.like.service';
import { V1MigrationPushMessageService } from './v1.migration.push.message.service';

@Injectable()
export class V1MigrationMainService {
  constructor(
    private migrationUserService: V1MigrationUserService,
    private migrationRelationshipService: V1MigrationRelationshipService,
    private migrationBlockService: V1MigrationBlocksService,
    private migrationQuestionService: V1MigrationQuestionService,
    private migrationLikeService: V1MigrationLikeService,
    private migrationPushMessageService: V1MigrationPushMessageService,
  ) {}

  async startMigration() {
    Logger.log(`Welcome to QuestionIt migration from beta to v2.`);
    Logger.log(`Migration will start in a few seconds.`);

    await new Promise(resolve => setTimeout(resolve, 5000));

    MigrationMappingContext.run(() => {
      MigrationTransactionContext.run(async () => {
        await this.migrationUserService.migrate();
        await this.migrationRelationshipService.migrate();
        await this.migrationBlockService.migrate();
        await this.migrationQuestionService.migrate();
        await this.migrationLikeService.migrate();
        await this.migrationPushMessageService.migrate();

        Logger.log(`SUCCESS: Migration done successfully.`);
      });
    });
  }
}
