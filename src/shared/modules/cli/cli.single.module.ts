import { Module } from '@nestjs/common';
import { CliModuleController } from './cli.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseConfigService } from '../../../database/database.config.service';

@Module({
  imports: [
    // Database
    TypeOrmModule.forRoot(DatabaseConfigService.getConfig()),
  ],
  controllers: [CliModuleController],
  providers: [],
  exports: [],
})
export class CliSingleModule {}
