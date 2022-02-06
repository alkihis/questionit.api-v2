import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { RequestUserManager } from '../../managers/request.user.manager';
import { Block } from '../../../database/entities/block.entity';
import { ErrorService } from '../errors/error.service';
import { EApiError } from '../errors/error.enum';

@Injectable()
export class BlockSharedService {
  constructor(
    @InjectConnection() private db: Connection,
  ) {}

  async ensureUserCanSeeTarget(user: RequestUserManager, targetId: number) {
    const canSeeTarget = await this.canUserSeeTarget(user, targetId);

    if (!canSeeTarget) {
      throw ErrorService.throw(EApiError.BlockByThisUser);
    }
  }

  async canUserSeeTarget(user: RequestUserManager, targetId: number) {
    return !(await this.isBlockedBy(user.id, targetId));
  }

  async isBlockedBy(sourceId: number, targetId: number) {
    const block = await this.db.getRepository(Block)
      .findOne({ where: { ownerId: targetId, targetId: sourceId } });

    return !!block;
  }

  async hasBlocked(sourceId: number, targetId: number) {
    const block = await this.db.getRepository(Block)
      .findOne({ where: { ownerId: sourceId, targetId } });

    return !!block;
  }
}
