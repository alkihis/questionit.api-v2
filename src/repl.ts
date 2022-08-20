import { repl } from '@nestjs/core';
import * as typeorm  from 'typeorm';
import { AppModule } from './app/app.module';
import { ENTITIES } from './database/entities';
import { RedisService } from './shared/modules/redis/redis.service';
import { RequestContext } from './shared/modules/context/request.context.model';
import { User } from './database/entities/user.entity';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const server = await repl(AppModule);

  // Define REPL available variables
  server.context.db = server.context.get(server.context.AppService).db; // Extract db from AppService instance.
  server.context.redis = RedisService;
  server.context.model = Object.fromEntries(ENTITIES.map(e => [e.name, e]));
  server.context.typeorm = typeorm;
  server.context.asLogged = async (user: User | number, callback: Function) => {
    if (typeof user === 'number') {
      user = await (server.context.db as DataSource).getRepository(User).findOneByOrFail({ id: user });
    }

    const req: any = { user };
    const res: any = {};
    const ctx = new RequestContext(req, res);

    return RequestContext.cls.run(ctx, () => callback());
  };

  // EXAMPLE USAGE: Obtain list of followings of 'Alkihis'
  // -----------------------------------------------------
  //  rel = get(RelationshipService)
  //  alki = await db.getRepository(model.User).findOneBy({ slug: typeorm.ILike('%alki%') })
  //  await asLogged(alki, () => rel.getFollowingsList(alki.id, { pageSize: 20, page: 0 }))
}

void bootstrap();
