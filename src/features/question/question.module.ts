import { Module } from '@nestjs/common';
import { QuestionService } from './question.service';
import { QuestionController } from './question.controller';
import { DayQuestionService } from './day.question.service';

@Module({
  imports: [],
  controllers: [QuestionController],
  providers: [QuestionService, DayQuestionService],
})
export class QuestionModule {}
