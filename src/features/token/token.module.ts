import { Module } from '@nestjs/common';
import { TokenController } from './token.controller';
import { TokenService } from './token.service';
import { JwtModule } from '../../shared/modules/jwt/jwt.module';

@Module({
  imports: [JwtModule],
  controllers: [TokenController],
  providers: [TokenService],
})
export class TokenModule {}
