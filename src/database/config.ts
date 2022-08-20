import { ENTITIES } from './entities';
import config from '../shared/config/config';
import type { DataSourceOptions } from 'typeorm';

export const DB_CONFIG: DataSourceOptions = {
  type: 'postgres',
  host: config.DB.HOST,
  port: 5432,
  username: config.ENV_IS.MIGRATION ? config.DB.SUPERUSER : config.DB.USER,
  password: config.ENV_IS.MIGRATION ? config.DB.SUPERUSER_PASSWORD : config.DB.PASSWORD,
  database: config.DB.DATABASE,
  entities: [...ENTITIES],
  logging: config.DB.LOGGING,
  migrationsRun: false,
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  // TODO write script to use TypeORM 0.3.x migration system.
  // cli: {
  //   // Location of migration should be inside src folder
  //   // to be compiled into dist/ folder.
  //   migrationsDir: 'src/database/migrations',
  // },
};
