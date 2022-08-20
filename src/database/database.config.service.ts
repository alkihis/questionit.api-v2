import { DB_CONFIG } from './config';
import { DatabaseLogger } from '../shared/logger/database.logger';
import config from '../shared/config/config';
import { DataSourceOptions } from 'typeorm';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

export class DatabaseConfigService {
  static getConfig() {
    const dbConfig: Mutable<DataSourceOptions> = { ...DB_CONFIG };

    if (config.ENV_IS.DEV) {
      dbConfig.maxQueryExecutionTime = 1; // to have all request timings
      dbConfig.logger = new DatabaseLogger(dbConfig.logging);
    }

    return dbConfig;
  }
}
