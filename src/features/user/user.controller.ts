import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, Req, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { TEditProfileFiles, UserService } from './user.service';
import { JwtAuthGuard } from '../../shared/guards/jwt.auth.guard';
import { Request } from 'express';
import { JwtOrAnonymousAuthGuard } from '../../shared/guards/jwt.or.anonymous.auth.guard';
import { getValidationPipe } from '../../shared/pipes/validation.pipe.utils';
import { BlockedWordsDto, EditUserDto, SearchUserDto } from './user.dto';
import { Right, RightsGuard } from '../../shared/guards/rights.guard';
import { EApplicationRight } from '../../database/enums/questionit.application.enum';
import config from '../../shared/config/config';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { RateLimit, RateLimitGuard } from '../../shared/guards/rate.limit.guard';
import { Timing } from '../../shared/utils/time.utils';

@Controller()
export class UserController {
  constructor(
    private userService: UserService,
  ) {}

  @Get('user/logged')
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @RateLimit(15, Timing.minutes(1))
  async loggedUser(@Req() req: Request) {
    return await this.userService.getLoggedUser(req.user);
  }

  @Get('user/id/:id')
  @UseGuards(JwtOrAnonymousAuthGuard, RateLimitGuard)
  @RateLimit(900, Timing.minutes(15))
  async findUserById(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    return await this.userService.getUserById(req.user, id);
  }

  @Get('user/slug/:slug')
  @UseGuards(JwtOrAnonymousAuthGuard, RateLimitGuard)
  @RateLimit(900, Timing.minutes(15))
  async findUserBySlug(@Req() req: Request, @Param('slug') slug: string) {
    return await this.userService.getUserBySlug(req.user, slug);
  }

  @Get('user/search')
  @UseGuards(JwtOrAnonymousAuthGuard, RateLimitGuard)
  @RateLimit(180, Timing.minutes(15))
  async searchUser(@Req() req: Request, @Query(getValidationPipe()) query: SearchUserDto) {
    return await this.userService.searchUsers(req.user, query);
  }

  @Get('user/check-available-slug')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.InternalUseOnly)
  @RateLimit(300, Timing.minutes(15))
  async testIfSlugIsAvailable(@Req() req: Request, @Query('slug') slug: string) {
    return await this.userService.isSlugAvailable(req.user, slug);
  }

  @Patch('user/sync-profile-with-twitter')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.InternalUseOnly)
  @RateLimit(15, Timing.minutes(15))
  async syncProfileWithTwitter(@Req() req: Request) {
    return await this.userService.syncProfileWithTwitter(req.user);
  }

  @Delete('user')
  @UseGuards(JwtAuthGuard, RightsGuard)
  @Right(EApplicationRight.InternalUseOnly)
  async deleteProfile(@Req() req: Request) {
    await this.userService.deleteAccount(req.user);
  }

  @Get('user/settings/blocked-words')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.ManageBlockedWords)
  @RateLimit(300, Timing.minutes(15))
  async getBlockedWords(@Req() req: Request) {
    return req.user.entity.blockedWords;
  }

  @Post('user/settings/blocked-words')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.ManageBlockedWords)
  @RateLimit(50, Timing.minutes(15))
  async saveBlcokedWords(@Req() req: Request, @Body(getValidationPipe()) dto: BlockedWordsDto) {
    return await this.userService.updateBlockedUsers(req.user, dto.words);
  }

  @Post('user/settings')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.InternalUseOnly)
  @RateLimit(15, Timing.minutes(1))
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'avatar', maxCount: 1 },
    { name: 'background', maxCount: 1 },
  ], {
    dest: config.UPLOAD.TEMPORARY,
    limits: {
      fileSize: config.LIMITS.FILE_SIZE,
    },
  }))
  async editUser(
    @Req() req: Request,
    @Body(getValidationPipe()) body: EditUserDto,
    @UploadedFiles() files: TEditProfileFiles,
  ) {
    return await this.userService.updateUserSettings(req.user, body, files);
  }
}
