import { Module } from '@nestjs/common';
import { BlockService } from './block.service';
import { BlockController } from './block.controller';

@Module({
  imports: [],
  controllers: [BlockController],
  providers: [BlockService],
})
export class BlockModule {}
