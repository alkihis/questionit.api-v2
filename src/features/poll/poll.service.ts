import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';
import { MakePollDto } from './poll.dto';
import { cleanBlankCharacters } from '../../shared/utils/string.utils';
import { Poll } from '../../database/entities/poll.entity';
import { DateTime } from 'luxon';
import { IUnusedSentPoll } from '../../database/interfaces/poll.interface';
import { RequestContextService } from '../../shared/modules/context/request.context.service';

@Injectable()
export class PollService {
  constructor(
    @InjectConnection() private db: Connection,
    private requestContextService: RequestContextService,
  ) {}

  async makePoll(dto: MakePollDto): Promise<IUnusedSentPoll> {
    const context = this.requestContextService;

    const options = dto.options.map(option => cleanBlankCharacters(option));
    const pollValidity = DateTime.now().plus({ minutes: 15 });

    const poll = this.db.getRepository(Poll).create({
      ownerId: context.user?.id || null,
      emitterIp: context.request.ips?.[0] || context.request.ip,
      options,
    });

    await this.db.getRepository(Poll).save(poll);

    return {
      id: poll.id,
      expiration: pollValidity.toMillis(),
    };
  }
}
