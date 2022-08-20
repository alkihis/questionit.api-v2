import { Injectable } from '@nestjs/common';
import config from '../shared/config/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(
    @InjectDataSource() private readonly db: DataSource, // Used in REPL
  ) {}

  getHello() {
    return { server: 'QuestionIt.space', version: config.VERSION };
  }
}
