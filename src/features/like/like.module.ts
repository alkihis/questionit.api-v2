import { Module } from '@nestjs/common';
import { LikeService } from './like.service';
import { LikeController } from './like.controller';

@Module({
  imports: [],
  controllers: [LikeController],
  providers: [LikeService],
})
export class LikeModule {}
