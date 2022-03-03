import { Controller, Delete, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { RelationshipService } from './relationship.service';
import { JwtAuthGuard } from '../../shared/guards/jwt.auth.guard';
import { Right, RightsGuard } from '../../shared/guards/rights.guard';
import { EApplicationRight } from '../../database/enums/questionit.application.enum';
import { getValidationPipe } from '../../shared/pipes/validation.pipe.utils';
import { ListFollowersOrFollowingsDto } from './relationship.dto';
import { RateLimit, RateLimitGuard } from '../../shared/guards/rate.limit.guard';
import { Timing } from '../../shared/utils/time.utils';
import { RequestContextService } from '../../shared/modules/context/request.context.service';

@Controller()
export class RelationshipController {
  constructor(
    private relationshipService: RelationshipService,
    private requestContextService: RequestContextService,
  ) {}

  @Get('relationship/with/:id')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.ReadRelationship)
  @RateLimit(900, Timing.minutes(15))
  async getRelationshipWith(@Param('id', ParseIntPipe) userId: number) {
    return await this.relationshipService.getRelationshipBetween(this.requestContextService.user.id, userId);
  }

  @Get('relationship/between/:source/and/:target')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.ReadRelationship)
  @RateLimit(300, Timing.minutes(15))
  async getRelationshipBetween(
    @Param('source', ParseIntPipe) sourceUserId: number,
    @Param('target', ParseIntPipe) targetUserId: number,
  ) {
    return await this.relationshipService.getRelationshipBetween(sourceUserId, targetUserId);
  }

  @Get('relationship/followers')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.ReadRelationship)
  @RateLimit(180, Timing.minutes(15))
  async getFollowersOfUser(@Query(getValidationPipe()) query: ListFollowersOrFollowingsDto) {
    const user = this.requestContextService.user;
    return await this.relationshipService.getFollowersList(user.id, query);
  }

  @Get('relationship/followings')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.ReadRelationship)
  @RateLimit(180, Timing.minutes(15))
  async getFollowingsOfUser( @Query(getValidationPipe()) query: ListFollowersOrFollowingsDto) {
    const user = this.requestContextService.user;
    return await this.relationshipService.getFollowingsList(user.id, query);
  }

  @Post('relationship/:id')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.FollowUser)
  @RateLimit(15, Timing.minutes(1))
  async followUser(@Param('id', ParseIntPipe) userId: number) {
    const user = this.requestContextService.user;
    return await this.relationshipService.follow(user.entity, userId);
  }

  @Delete('relationship/:id')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.FollowUser)
  @RateLimit(15, Timing.minutes(1))
  async unfollowUser(@Param('id', ParseIntPipe) userId: number) {
    const user = this.requestContextService.user;
    return await this.relationshipService.unfollow(user.entity, userId);
  }
}
