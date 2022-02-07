import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { MakePollDto } from './poll.dto';
import { cleanBlankCharacters } from '../../shared/utils/string.utils';
import { Poll } from '../../database/entities/poll.entity';
import { Request } from 'express';
import { DateTime } from 'luxon';
import { IUnusedSentPoll } from '../../database/interfaces/poll.interface';

@Injectable()
export class PollService {
  constructor(
    @InjectConnection() private db: Connection,
  ) {}

  async makePoll(request: Request, dto: MakePollDto): Promise<IUnusedSentPoll> {
    const options = dto.options.map(option => cleanBlankCharacters(option));
    const pollValidity = DateTime.now().plus({ minutes: 15 });

    const poll = this.db.getRepository(Poll).create({
      ownerId: request.user?.id || null,
      emitterIp: request.ips?.[0] || request.ip,
      options,
    });

    await this.db.getRepository(Poll).save(poll);

    return {
      id: poll.id,
      expiration: pollValidity.toMillis(),
    };
  }
}
