import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { getValidationPipe } from '../../shared/pipes/validation.pipe.utils';
import { ApproveAppDto, CreateApplicationDto, CreateAppTokenDto } from './application.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt.auth.guard';
import { Right, RightsGuard } from '../../shared/guards/rights.guard';
import { EApplicationRight } from '../../database/enums/questionit.application.enum';
import { RateLimit, RateLimitGuard } from '../../shared/guards/rate.limit.guard';
import { Timing } from '../../shared/utils/time.utils';

@Controller()
export class ApplicationController {
  constructor(
    private applicationService: ApplicationService,
  ) {}

  @Get('application/token')
  @UseGuards(RateLimitGuard)
  @RateLimit(180, Timing.minutes(15))
  async getAppTokenDetails(@Query('token') token: string) {
    return await this.applicationService.getTokenDetails(token);
  }

  @Post('application/token')
  @UseGuards(RateLimitGuard)
  @RateLimit(5, Timing.minutes(10))
  async generateFreshAppToken(@Body(getValidationPipe()) body: CreateAppTokenDto) {
    return await this.applicationService.createAppToken(body);
  }

  @Post('application/approve')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.InternalUseOnly)
  @RateLimit(5, Timing.minutes(10))
  async approveTokenForApplication(@Body(getValidationPipe()) body: ApproveAppDto) {
    return await this.applicationService.approveTokenForApplication(body);
  }

  @Get('application')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.InternalUseOnly)
  @RateLimit(180, Timing.minutes(15))
  async listApplications() {
    return await this.applicationService.listApplications();
  }

  @Post('application')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.InternalUseOnly)
  @RateLimit(2, Timing.minutes(30))
  async createApplication(@Body(getValidationPipe()) body: CreateApplicationDto) {
    return await this.applicationService.createApplication(body);
  }

  @Put('application/:id')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.InternalUseOnly)
  @RateLimit(10, Timing.minutes(1))
  async editApplication(@Param('id', ParseIntPipe) appId: number, @Body(getValidationPipe()) body: CreateApplicationDto) {
    return await this.applicationService.editApplication(appId, body);
  }

  @Patch('application/:id/regenerate-key')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.InternalUseOnly)
  @RateLimit(1, Timing.minutes(1))
  async regenerateApplicationKey(@Param('id', ParseIntPipe) appId: number) {
    return await this.applicationService.regenerateApplicationKey(appId);
  }

  @Delete('application/:id')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.InternalUseOnly)
  @RateLimit(30, Timing.minutes(15))
  async deleteApplication(@Param('id', ParseIntPipe) appId: number) {
    return await this.applicationService.deleteApplication(appId);
  }

  @Get('application/subscribed')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.InternalUseOnly)
  @RateLimit(180, Timing.minutes(15))
  async listActiveApplicationsFromTokens() {
    return await this.applicationService.listActiveApplicationsFromTokens();
  }

  @Delete('application/subscribed/:id')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.InternalUseOnly)
  @RateLimit(30, Timing.minutes(1))
  async deleteApplicationSubscription(@Param('id', ParseIntPipe) appId: number) {
    return await this.applicationService.deleteApplicationSubscription(appId);
  }
}
