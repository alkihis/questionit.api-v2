import { Module } from '@nestjs/common';
import { CliModuleController } from './cli.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DB_CONFIG } from '../../../database/config';

@Module({
  imports: [
    // Database
    TypeOrmModule.forRoot(DB_CONFIG),
  ],
  controllers: [CliModuleController],
  providers: [],
  exports: [],
})
export class CliSingleModule {}
