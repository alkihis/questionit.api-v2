import { Body, Controller, Delete, Get, Post, Query, UseGuards } from '@nestjs/common';
import { TokenService } from './token.service';
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
  async twitterCallback(@Query(getValidationPipe()) query: GetAccessTokenDto) {
    return await this.tokenService.loginFromTwitter(query);
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
  async verifyToken() {
    return await this.tokenService.checkUserTokensValidity();
  }

  @Post('token/create')
  @UseGuards(RateLimitGuard)
  @RateLimit(10, Timing.minutes(15))
  async createTokenForApplication(@Body() body: CreateTokenDto) {
    return await this.tokenService.createTokenForApplication(body);
  }

  @Post('token/refresh')
  @UseGuards(RateLimitGuard)
  @Right(EApplicationRight.RefreshToken)
  @RateLimit(5, Timing.minutes(15))
  async refreshToken() {
    return await this.tokenService.refreshToken();
  }

  @Get('token')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.InternalUseOnly)
  @RateLimit(15, Timing.minutes(1))
  async getMyTokens() {
    return await this.tokenService.listTokens();
  }

  /**
   * Revoke BY JTI !
   * If token is not specified, current token will be revoked.
   */
  @Delete('token')
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @RateLimit(15, Timing.minutes(1))
  async revoke(@Query('token') token: string) {
    await this.tokenService.revokeToken(token);
  }
}
