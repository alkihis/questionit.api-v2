import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { QuestionService, TUploadAnswerPicture } from './question.service';
import { DayQuestionService } from './day.question.service';
import { JwtAuthGuard } from '../../shared/guards/jwt.auth.guard';
import { Right, RightsGuard } from '../../shared/guards/rights.guard';
import { EApplicationRight } from '../../database/enums/questionit.application.enum';
import { getValidationPipe } from '../../shared/pipes/validation.pipe.utils';
import { AnswerQuestionDto, GetQuestionAncestorsDto, GetQuestionOfTheDayDto, GetQuestionOfUserDto, GetQuestionRepliesDto, GetQuestionTimelineDto, GetWaitingQuestionsDto, MakeQuestionDto } from './question.dto';
import { TDayQuestionLanguage } from '../../database/entities/day.question.entity';
import { JwtOrAnonymousAuthGuard } from '../../shared/guards/jwt.or.anonymous.auth.guard';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import config from '../../shared/config/config';
import { RateLimit, RateLimitGuard } from '../../shared/guards/rate.limit.guard';
import { Timing } from '../../shared/utils/time.utils';

// TODO: Endpoint to list questions sent by a user to everyone? /question/sent

@Controller()
export class QuestionController {
  constructor(
    private questionService: QuestionService,
    private dayQuestionService: DayQuestionService,
  ) {}

  @Get('question/day/of/:lang')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.InternalUseOnly)
  @RateLimit(10, Timing.minutes(1))
  async getDayQuestion(@Param('lang') lang: string, @Query(getValidationPipe()) query: GetQuestionOfTheDayDto) {
    return await this.dayQuestionService.getQuestionOfTheDay(lang as TDayQuestionLanguage, query.date);
  }

  @Post('question/anonymous')
  @UseGuards(JwtOrAnonymousAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.SendQuestion)
  @RateLimit(10, Timing.minutes(1))
  async sendQuestionAsAnonymous(@Body(getValidationPipe()) body: MakeQuestionDto) {
    return await this.questionService.makeQuestion(body, true);
  }

  @Post('question')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.SendQuestion)
  @RateLimit(10, Timing.minutes(1))
  async sendQuestionAsLoggedUser(@Body(getValidationPipe()) body: MakeQuestionDto) {
    return await this.questionService.makeQuestion(body, false);
  }

  @Get('question/answer/user/:id')
  @UseGuards(JwtOrAnonymousAuthGuard, RateLimitGuard)
  @RateLimit(300, Timing.minutes(15))
  async listQuestionsReceivedByUser(
    @Param('id', ParseIntPipe) userId: number,
    @Query(getValidationPipe()) query: GetQuestionOfUserDto) {
    return await this.questionService.listQuestionsReceivedByUser(userId, query);
  }

  @Get('question/waiting')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.ReadWaitingQuestions)
  @RateLimit(300, Timing.minutes(15))
  async readAwaitingQuestionsOfUser(@Query(getValidationPipe()) query: GetWaitingQuestionsDto) {
    return await this.questionService.listWaitingQuestions(query);
  }

  @Get('question/waiting/count')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.ReadWaitingQuestions)
  @RateLimit(900, Timing.minutes(15))
  async readAwaitingQuestionCountOfUser() {
    return await this.questionService.getWaitingQuestionsCounts();
  }

  @Get('question/ancestors/:id')
  @UseGuards(JwtOrAnonymousAuthGuard, RateLimitGuard)
  @RateLimit(180, Timing.minutes(15))
  async getQuestionAndAncestors(
    @Param('id', ParseIntPipe) questionId: number,
    @Query(getValidationPipe()) query: GetQuestionAncestorsDto,
  ) {
    return await this.questionService.getQuestionAndAncestors(questionId, query);
  }

  @Get('question/replies/:id')
  @UseGuards(JwtOrAnonymousAuthGuard, RateLimitGuard)
  @RateLimit(180, Timing.minutes(15))
  async getRepliesOfQuestion(
    @Param('id', ParseIntPipe) questionId: number,
    @Query(getValidationPipe()) query: GetQuestionRepliesDto,
  ) {
    return await this.questionService.getRepliesOfQuestion(questionId, query);
  }

  @Get('question/answer/timeline')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.ReadTimeline)
  @RateLimit(180, Timing.minutes(15))
  async getQuestionTimelineOfUser(@Query(getValidationPipe()) query: GetQuestionTimelineDto) {
    return await this.questionService.getQuestionTimelineOfUser(query);
  }

  @Post('question/:id/answer')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.AnswerQuestion)
  @RateLimit(10, Timing.minutes(1))
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'picture', maxCount: 1 },
  ], {
    dest: config.UPLOAD.TEMPORARY,
    limits: {
      fileSize: 8 * 1024 * 1024,
    },
  }))
  async answerQuestion(
    @Param('id', ParseIntPipe) questionId: number,
    @Body(getValidationPipe()) body: AnswerQuestionDto,
    @UploadedFiles() files: TUploadAnswerPicture,
  ) {
    return await this.questionService.answerToQuestion({
      questionId,
      dto: body,
      files,
    });
  }

  @Delete('question/waiting/blocked')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.DeleteQuestion)
  @RateLimit(5, Timing.minutes(1))
  async deleteQuestionsWithBlockedWords() {
    return await this.questionService.deleteAllPendingMutedQuestions();
  }

  @Patch('question/pin/:id')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.PinQuestions)
  @RateLimit(30, Timing.minutes(15))
  async pinQuestionToProfile(@Param('id', ParseIntPipe) questionId: number) {
    return await this.questionService.pinQuestionToProfile(questionId);
  }

  @Delete('question/pin')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.PinQuestions)
  @RateLimit(30, Timing.minutes(15))
  async unpinQuestionOfProfile() {
    return await this.questionService.unpinQuestionOfProfile();
  }

  @Delete('question/:id')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.DeleteQuestion)
  @RateLimit(180, Timing.minutes(15))
  async deleteQuestionById(@Param('id', ParseIntPipe) questionId: number) {
    return await this.questionService.deleteQuestion(questionId);
  }
}
