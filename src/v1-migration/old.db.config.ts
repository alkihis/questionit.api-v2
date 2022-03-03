import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import config from '../shared/config/config';

export const OLD_DB_CONFIG: TypeOrmModuleOptions = {
  type: 'mysql',
  host: config.MIGRATION.DB.HOST,
  port: 3306,
  username: config.MIGRATION.DB.USER,
  password: config.MIGRATION.DB.PASSWORD,
  database: config.MIGRATION.DB.DATABASE,
  logging: true,
  migrationsRun: false,
};
