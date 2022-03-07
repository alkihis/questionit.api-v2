import { Injectable } from '@nestjs/common';
import config from '../shared/config/config';

@Injectable()
export class AppService {
  getHello() {
    return { server: 'QuestionIt.space', version: config.VERSION };
  }
}
