import { Global, Module } from '@nestjs/common';
import { SendableSharedService } from './sendable/sendable.shared.service';
import { SendableQuestionSharedService } from './sendable/sendable.question.shared.service';
import { SendableUserSharedService } from './sendable/sendable.user.shared.service';
import { TwitterService } from './twitter/twitter.service';
import { MediasService } from './medias/medias.service';
import { SendableRelationshipSharedService } from './sendable/sendable.relationship.shared.service';
import { BlockSharedService } from './blocks/block.shared.service';
import { NotificationSharedService } from './notifications/notification.shared.service';
import { RequestContextModule } from './context/request.context.module';
import { RequestContextService } from './context/request.context.service';

@Global()
@Module({
  imports: [RequestContextModule],
  controllers: [],
  providers: [
    MediasService,
    TwitterService,
    SendableRelationshipSharedService,
    SendableQuestionSharedService,
    SendableUserSharedService,
    SendableSharedService,
    BlockSharedService,
    NotificationSharedService,
    RequestContextService,
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
    RequestContextService,
  ],
})
export class GlobalSharedModule {}
