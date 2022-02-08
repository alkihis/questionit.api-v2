import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { QuestionService, TUploadAnswerPicture } from './question.service';
import { DayQuestionService } from './day.question.service';
import { JwtAuthGuard } from '../../shared/guards/jwt.auth.guard';
import { Right, RightsGuard } from '../../shared/guards/rights.guard';
import { EApplicationRight } from '../../database/enums/questionit.application.enum';
import { Request } from 'express';
import { getValidationPipe } from '../../shared/pipes/validation.pipe.utils';
import { AnswerQuestionDto, GetQuestionAncestorsDto, GetQuestionOfTheDayDto, GetQuestionOfUserDto, GetQuestionRepliesDto, GetQuestionTimelineDto, GetWaitingQuestionsDto, MakeQuestionDto } from './question.dto';
import { TDayQuestionLanguage } from '../../database/entities/day.question.entity';
import { JwtOrAnonymousAuthGuard } from '../../shared/guards/jwt.or.anonymous.auth.guard';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import config from '../../shared/config/config';

// TODO: Endpoint to list questions sent by a user to everyone? /question/sent

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
  async listQuestionsReceivedByUser(@Req() req: Request, @Query(getValidationPipe()) query: GetQuestionOfUserDto) {
    return await this.questionService.listQuestionsReceivedByUser(req.user, query);
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

  @Get('question/ancestors/:id')
  @UseGuards(JwtOrAnonymousAuthGuard)
  async getQuestionAndAncestors(
    @Req() req: Request,
    @Param('id', ParseIntPipe) questionId: number,
    @Query(getValidationPipe()) query: GetQuestionAncestorsDto,
  ) {
    return await this.questionService.getQuestionAndAncestors(req.user, questionId, query);
  }

  @Get('question/replies/:id')
  @UseGuards(JwtOrAnonymousAuthGuard)
  async getRepliesOfQuestion(
    @Req() req: Request,
    @Param('id', ParseIntPipe) questionId: number,
    @Query(getValidationPipe()) query: GetQuestionRepliesDto,
  ) {
    return await this.questionService.getRepliesOfQuestion(req.user, questionId, query);
  }

  @Get('question/timeline')
  @UseGuards(JwtAuthGuard, RightsGuard)
  @Right(EApplicationRight.ReadTimeline)
  async getQuestionTimelineOfUser(@Req() req: Request, @Query(getValidationPipe()) query: GetQuestionTimelineDto) {
    return await this.questionService.getQuestionTimelineOfUser(req.user, query);
  }

  @Post('question/:id/answer')
  @UseGuards(JwtAuthGuard, RightsGuard)
  @Right(EApplicationRight.AnswerQuestion)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'picture', maxCount: 1 },
  ], {
    dest: config.UPLOAD.TEMPORARY,
    limits: {
      fileSize: 8 * 1024 * 1024,
    },
  }))
  async answerQuestion(
    @Req() req: Request,
    @Param('id', ParseIntPipe) questionId: number,
    @Body(getValidationPipe()) body: AnswerQuestionDto,
    @UploadedFiles() files: TUploadAnswerPicture,
  ) {
    return await this.questionService.answerToQuestion({
      user: req.user,
      questionId,
      dto: body,
      files,
    });
  }

  @Delete('question/:id')
  @UseGuards(JwtAuthGuard, RightsGuard)
  @Right(EApplicationRight.DeleteQuestion)
  async deleteQuestionById(@Req() req: Request, @Param('id', ParseIntPipe) questionId: number) {
    return await this.questionService.deleteQuestion(req.user, questionId);
  }

  @Delete('question/waiting/blocked')
  @UseGuards(JwtAuthGuard, RightsGuard)
  @Right(EApplicationRight.DeleteQuestion)
  async deleteQuestionsWithBlockedWords(@Req() req: Request) {
    return await this.questionService.deleteAllPendingMutedQuestions(req.user);
  }

  @Patch('question/pin/:id')
  @UseGuards(JwtAuthGuard, RightsGuard)
  @Right(EApplicationRight.PinQuestions)
  async pinQuestionToProfile(@Req() req: Request, @Param('id', ParseIntPipe) questionId: number) {
    return await this.questionService.pinQuestionToProfile(req.user, questionId);
  }

  @Delete('question/pin')
  @UseGuards(JwtAuthGuard, RightsGuard)
  @Right(EApplicationRight.PinQuestions)
  async unpinQuestionOfProfile(@Req() req: Request) {
    return await this.questionService.unpinQuestionOfProfile(req.user);
  }

  // TODO: DELETE question/muted => ? (useful?)
}
