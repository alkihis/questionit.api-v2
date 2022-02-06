import { Module } from '@nestjs/common';
import { TokenController } from './token.controller';
import { TokenService } from './token.service';
import { JwtModule } from '@nestjs/jwt';
import config from '../../shared/config/config';

@Module({
  imports: [
    JwtModule.register({
      secret: config.JWT.SECRET,
      signOptions: { expiresIn: config.JWT.EXPIRATION },
    }),
  ],
  controllers: [TokenController],
  providers: [TokenService],
})
export class TokenModule {}
