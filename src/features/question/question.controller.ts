import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { QuestionService } from './question.service';
import { DayQuestionService } from './day.question.service';
import { JwtAuthGuard } from '../../shared/guards/jwt.auth.guard';
import { Right, RightsGuard } from '../../shared/guards/rights.guard';
import { EApplicationRight } from '../../database/enums/questionit.application.enum';
import { Request } from 'express';
import { getValidationPipe } from '../../shared/pipes/validation.pipe.utils';
import { GetQuestionOfTheDayDto, GetQuestionOfUserDto, GetWaitingQuestionsDto, MakeQuestionDto } from './question.dto';
import { TDayQuestionLanguage } from '../../database/entities/day.question.entity';
import { JwtOrAnonymousAuthGuard } from '../../shared/guards/jwt.or.anonymous.auth.guard';

@Controller()
export class QuestionController {
  constructor(
    private questionService: QuestionService,
    private dayQuestionService: DayQuestionService,
  ) {}

  @Get('question/day/of/:lang')
  @UseGuards(JwtAuthGuard, RightsGuard)
  @Right(EApplicationRight.InternalUseOnly)
  async getDayQuestion(@Req() req: Request, @Param('lang') lang: string, @Query(getValidationPipe()) query: GetQuestionOfTheDayDto) {
    return await this.dayQuestionService.getQuestionOfTheDay(req.user, lang as TDayQuestionLanguage, query.date);
  }

  @Post('question/anonymous')
  @UseGuards(JwtOrAnonymousAuthGuard, RightsGuard)
  @Right(EApplicationRight.SendQuestion)
  async sendQuestionAsAnonymous(@Req() req: Request, @Body(getValidationPipe()) body: MakeQuestionDto) {
    return await this.questionService.makeQuestion(req, body, true);
  }

  @Post('question')
  @UseGuards(JwtAuthGuard, RightsGuard)
  @Right(EApplicationRight.SendQuestion)
  async sendQuestionAsLoggedUser(@Req() req: Request, @Body(getValidationPipe()) body: MakeQuestionDto) {
    return await this.questionService.makeQuestion(req, body, false);
  }

  @Get('question')
  @UseGuards(JwtOrAnonymousAuthGuard)
  async readQuestionsOfUser(@Req() req: Request, @Query(getValidationPipe()) query: GetQuestionOfUserDto) {
    return await this.questionService.listQuestionsOfUser(req.user, query);
  }

  @Get('question/waiting')
  @UseGuards(JwtAuthGuard, RightsGuard)
  @Right(EApplicationRight.ReadWaitingQuestions)
  async readAwaitingQuestionsOfUser(@Req() req: Request, @Query(getValidationPipe()) query: GetWaitingQuestionsDto) {
    return await this.questionService.listWaitingQuestions(req.user, query);
  }

  @Get('question/waiting/count')
  @UseGuards(JwtAuthGuard, RightsGuard)
  @Right(EApplicationRight.ReadWaitingQuestions)
  async readAwaitingQuestionCountOfUser(@Req() req: Request) {
    return await this.questionService.getWaitingQuestionsCounts(req.user);
  }
}
