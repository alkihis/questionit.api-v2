import { JwtModule as NestJwtModule } from '@nestjs/jwt';
import config from '../../config/config';

export const JwtModule = NestJwtModule.register({
  secret: config.JWT.SECRET,
});
