import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { TEditProfileFiles, UserService } from './user.service';
import { JwtAuthGuard } from '../../shared/guards/jwt.auth.guard';
import { JwtOrAnonymousAuthGuard } from '../../shared/guards/jwt.or.anonymous.auth.guard';
import { getValidationPipe } from '../../shared/pipes/validation.pipe.utils';
import { BlockedWordsDto, EditUserDto, SearchUserDto } from './user.dto';
import { Right, RightsGuard } from '../../shared/guards/rights.guard';
import { EApplicationRight } from '../../database/enums/questionit.application.enum';
import config from '../../shared/config/config';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { RateLimit, RateLimitGuard } from '../../shared/guards/rate.limit.guard';
import { Timing } from '../../shared/utils/time.utils';
import { RequestContextService } from '../../shared/modules/context/request.context.service';

@Controller()
export class UserController {
  constructor(
    private userService: UserService,
    private requestContextService: RequestContextService,
  ) {}

  @Get('user/logged')
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @RateLimit(15, Timing.minutes(1))
  async loggedUser() {
    return await this.userService.getLoggedUser();
  }

  @Get('user/id/:id')
  @UseGuards(JwtOrAnonymousAuthGuard, RateLimitGuard)
  @RateLimit(900, Timing.minutes(15))
  async findUserById(@Param('id', ParseIntPipe) id: number) {
    return await this.userService.getUserById(id);
  }

  @Get('user/slug/:slug')
  @UseGuards(JwtOrAnonymousAuthGuard, RateLimitGuard)
  @RateLimit(900, Timing.minutes(15))
  async findUserBySlug(@Param('slug') slug: string) {
    return await this.userService.getUserBySlug(slug);
  }

  @Get('user/search')
  @UseGuards(JwtOrAnonymousAuthGuard, RateLimitGuard)
  @RateLimit(180, Timing.minutes(15))
  async searchUser(@Query(getValidationPipe()) query: SearchUserDto) {
    return await this.userService.searchUsers(query);
  }

  @Get('user/check-available-slug')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.InternalUseOnly)
  @RateLimit(300, Timing.minutes(15))
  async testIfSlugIsAvailable(@Query('slug') slug: string) {
    return await this.userService.isSlugAvailable(slug);
  }

  @Patch('user/sync-profile-with-twitter')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.InternalUseOnly)
  @RateLimit(15, Timing.minutes(15))
  async syncProfileWithTwitter() {
    return await this.userService.syncProfileWithTwitter();
  }

  @Delete('user')
  @UseGuards(JwtAuthGuard, RightsGuard)
  @Right(EApplicationRight.InternalUseOnly)
  async deleteProfile() {
    await this.userService.deleteAccount();
  }

  @Get('user/settings/blocked-words')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.ManageBlockedWords)
  @RateLimit(300, Timing.minutes(15))
  async getBlockedWords() {
    return this.requestContextService.user.entity.blockedWords;
  }

  @Post('user/settings/blocked-words')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.ManageBlockedWords)
  @RateLimit(50, Timing.minutes(15))
  async saveBlcokedWords(@Body(getValidationPipe()) dto: BlockedWordsDto) {
    return await this.userService.updateBlockedUsers(dto.words);
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
    @Body(getValidationPipe()) body: EditUserDto,
    @UploadedFiles() files: TEditProfileFiles,
  ) {
    return await this.userService.updateUserSettings(body, files);
  }
}
