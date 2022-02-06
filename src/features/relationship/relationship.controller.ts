import { Controller, Delete, Get, Param, ParseIntPipe, Post, Query, Req, UseGuards } from '@nestjs/common';
import { RelationshipService } from './relationship.service';
import { JwtAuthGuard } from '../../shared/guards/jwt.auth.guard';
import { Right, RightsGuard } from '../../shared/guards/rights.guard';
import { EApplicationRight } from '../../database/enums/questionit.application.enum';
import { Request } from 'express';
import { getValidationPipe } from '../../shared/pipes/validation.pipe.utils';
import { ListFollowersOrFollowingsDto } from './relationship.dto';
import { RateLimit, RateLimitGuard } from '../../shared/guards/rate.limit.guard';
import { Timing } from '../../shared/utils/time.utils';

@Controller()
export class RelationshipController {
  constructor(
    private relationshipService: RelationshipService,
  ) {}

  @Get('relationship/with/:id')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.ReadRelationship)
  @RateLimit(900, Timing.minutes(15))
  async getRelationshipWith(@Req() req: Request, @Param('id', ParseIntPipe) userId: number) {
    return await this.relationshipService.getRelationshipBetween(req.user.id, userId);
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
  async getFollowersOfUser(@Req() req: Request, @Query(getValidationPipe()) query: ListFollowersOrFollowingsDto) {
    return await this.relationshipService.getFollowersList(req.user, req.user.id, query);
  }

  @Get('relationship/followings')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.ReadRelationship)
  @RateLimit(180, Timing.minutes(15))
  async getFollowingsOfUser(@Req() req: Request, @Query(getValidationPipe()) query: ListFollowersOrFollowingsDto) {
    return await this.relationshipService.getFollowingsList(req.user, req.user.id, query);
  }

  @Post('relationship/:id')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.FollowUser)
  @RateLimit(15, Timing.minutes(1))
  async followUser(@Req() req: Request, @Param('id', ParseIntPipe) userId: number) {
    return await this.relationshipService.follow(req.user.entity, userId);
  }

  @Delete('relationship/:id')
  @UseGuards(JwtAuthGuard, RightsGuard, RateLimitGuard)
  @Right(EApplicationRight.FollowUser)
  @RateLimit(15, Timing.minutes(1))
  async unfollowUser(@Req() req: Request, @Param('id', ParseIntPipe) userId: number) {
    return await this.relationshipService.unfollow(req.user.entity, userId);
  }
}
