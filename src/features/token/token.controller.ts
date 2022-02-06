import { Body, Controller, Delete, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { TokenService } from './token.service';
import { Request } from 'express';
import { getValidationPipe } from '../../shared/pipes/validation.pipe.utils';
import { CreateTokenDto, GetAccessTokenDto } from './token.dto';
import { Right, RightsGuard } from '../../shared/guards/rights.guard';
import { JwtAuthGuard } from '../../shared/guards/jwt.auth.guard';
import { EApplicationRight } from '../../database/enums/questionit.application.enum';
import { RateLimit, RateLimitGuard } from '../../shared/guards/rate.limit.guard';
import { Timing } from '../../shared/utils/time.utils';

@Controller()
export class TokenController {
  constructor(
    private tokenService: TokenService,
  ) {}

  @Get('token/from-twitter/access')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, Timing.minutes(15))
  async twitterCallback(
    @Req() req: Request,
    @Query(getValidationPipe()) query: GetAccessTokenDto,
  ) {
    return await this.tokenService.loginFromTwitter(req, query);
  }

  @Get('token/from-twitter/request')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, Timing.minutes(15))
  async getRequestToken() {
    return await this.tokenService.getRequestToken();
  }

  /**
   * Verify an existing JWT token and the Twitter tokens. Returns Twitter user object.
   */
  @Get('token/user')
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @RateLimit(75, Timing.minutes(15))
  async verifyToken(@Req() req: Request) {
    return await this.tokenService.checkUserTokensValidity(req.user);
  }

  @Post('token/create')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, Timing.minutes(15))
  async createTokenForApplication(@Req() req: Request, @Body() body: CreateTokenDto) {
    return await this.tokenService.createTokenForApplication(req, body);
  }

  @Get('token')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.InternalUseOnly)
  @RateLimit(15, Timing.minutes(1))
  async getMyTokens(@Req() req: Request) {
    return await this.tokenService.listTokens(req.user);
  }

  /**
   * Revoke BY JTI !
   * If token is not specified, current token will be revoked.
   */
  @Delete('token')
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @RateLimit(15, Timing.minutes(1))
  async revoke(@Req() req: Request, @Query('token') token: string) {
    await this.tokenService.revokeToken(req.user, token);
  }
}
