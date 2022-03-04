import { DB_CONFIG } from './config';
import { DatabaseLogger } from '../shared/logger/database.logger';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import config from '../shared/config/config';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

export class DatabaseConfigService {
  static getConfig() {
    const dbConfig: Mutable<TypeOrmModuleOptions> = { ...DB_CONFIG };

    if (config.ENV_IS.DEV) {
      dbConfig.maxQueryExecutionTime = 1; // to have all request timings
      dbConfig.logger = new DatabaseLogger(dbConfig.logging);
    }

    return dbConfig;
  }
}
