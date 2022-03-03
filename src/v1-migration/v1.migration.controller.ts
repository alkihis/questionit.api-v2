import { V1MigrationMainService } from './service/v1.migration.main.service';
import { Controller } from '@nestjs/common';

@Controller()
export class V1MigrationController {
  constructor(
    private readonly migrationService: V1MigrationMainService,
  ) {
    process.nextTick(() => this.migrationService.startMigration());
  }
}
