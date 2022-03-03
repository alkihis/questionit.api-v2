import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ENTITIES } from './entities';
import config from '../shared/config/config';

export const DB_CONFIG: TypeOrmModuleOptions = {
  type: 'postgres',
  host: config.DB.HOST,
  port: 5432,
  username: config.DB.USER,
  password: config.DB.PASSWORD,
  database: config.DB.DATABASE,
  entities: [...ENTITIES],
  logging: config.DB.LOGGING,
  migrationsRun: false,
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  cli: {
    // Location of migration should be inside src folder
    // to be compiled into dist/ folder.
    migrationsDir: 'src/database/migrations',
  },
};
