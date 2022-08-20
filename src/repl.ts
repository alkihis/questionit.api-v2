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
  const ctx = server.context;

  // Define REPL available variables
  ctx.db = ctx.get(ctx.AppService).db; // Extract db from AppService instance.
  ctx.redis = RedisService;
  ctx.model = Object.fromEntries(ENTITIES.map(e => [e.name, e]));
  ctx.typeorm = typeorm;
  ctx.asLogged = async (user: User | number, callback: Function) => {
    if (typeof user === 'number') {
      user = await (ctx.db as DataSource).getRepository(User).findOneByOrFail({ id: user });
    }

    const req: any = { user };
    const res: any = {};
    const reqCtx = new RequestContext(req, res);

    return RequestContext.cls.run(reqCtx, () => callback());
  };

  // EXAMPLE USAGE: Obtain list of followings of 'Alkihis'
  // -----------------------------------------------------
  //  rel = get(RelationshipService)
  //  alki = await db.getRepository(model.User).findOneBy({ slug: typeorm.ILike('%alki%') })
  //  await asLogged(alki, () => rel.getFollowingsList(alki.id, { pageSize: 20, page: 0 }))
}

void bootstrap();
