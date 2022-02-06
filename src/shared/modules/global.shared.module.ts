import { Global, Module } from '@nestjs/common';
import { SendableSharedService } from './sendable/sendable.shared.service';
import { SendableQuestionSharedService } from './sendable/sendable.question.shared.service';
import { SendableUserSharedService } from './sendable/sendable.user.shared.service';
import { TwitterService } from './twitter/twitter.service';
import { CliModuleController } from './cli/cli.controller';
import { MediasService } from './medias/medias.service';
import { SendableRelationshipSharedService } from './sendable/sendable.relationship.shared.service';
import { BlockSharedService } from './blocks/block.shared.service';
import { NotificationSharedService } from './notifications/notification.shared.service';

@Global()
@Module({
  imports: [],
  controllers: [CliModuleController],
  providers: [
    MediasService,
    TwitterService,
    SendableRelationshipSharedService,
    SendableQuestionSharedService,
    SendableUserSharedService,
    SendableSharedService,
    BlockSharedService,
    NotificationSharedService,
  ],
  exports: [
    MediasService,
    TwitterService,
    SendableRelationshipSharedService,
    SendableQuestionSharedService,
    SendableUserSharedService,
    SendableSharedService,
    BlockSharedService,
    NotificationSharedService,
  ],
})
export class GlobalSharedModule {}
