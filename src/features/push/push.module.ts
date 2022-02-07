import { Module } from '@nestjs/common';
import { PushService } from './push.service';
import { PushController } from './push.controller';
import { JwtModule } from '../../shared/modules/jwt/jwt.module';

@Module({
  imports: [JwtModule],
  controllers: [PushController],
  providers: [PushService],
})
export class PushModule {}
