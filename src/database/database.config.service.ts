import { DB_CONFIG } from './config';
import { DatabaseLogger } from '../shared/logger/database.logger';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

export class DatabaseConfigService {
  static getConfig() {
    const config: Mutable<TypeOrmModuleOptions> = { ...DB_CONFIG };

    config.maxQueryExecutionTime = 1; // to have all request timings
    config.logger = new DatabaseLogger(config.logging);

    return config;
  }
}
