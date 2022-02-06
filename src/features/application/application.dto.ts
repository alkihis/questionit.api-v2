import { IsBoolean, IsNotEmpty, IsObject, IsOptional, IsString, IsUrl, Matches, MaxLength, ValidateIf, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import config from '../../shared/config/config';

export class ApplicationRightsDto {
  @IsBoolean()
  @IsOptional()
  sendQuestion: boolean;

  @IsBoolean()
  @IsOptional()
  answerQuestion: boolean;

  @IsBoolean()
  @IsOptional()
  likeQuestion: boolean;

  @IsBoolean()
  @IsOptional()
  followUser: boolean;

  @IsBoolean()
  @IsOptional()
  blockUser: boolean;

  @IsBoolean()
  @IsOptional()
  readTimeline: boolean;

  @IsBoolean()
  @IsOptional()
  deleteQuestion: boolean;

  @IsBoolean()
  @IsOptional()
  readNotification: boolean;

  @IsBoolean()
  @IsOptional()
  deleteNotification: boolean;

  @IsBoolean()
  @IsOptional()
  readWaitingQuestion: boolean;

  @IsBoolean()
  @IsOptional()
  pinQuestion: boolean;

  @IsBoolean()
  @IsOptional()
  readRelationship: boolean;

  @IsBoolean()
  @IsOptional()
  manageBlockedWords: boolean;
}

export class CreateAppTokenDto {
  @IsString()
  @MaxLength(255)
  @IsNotEmpty()
  key: string;

  @IsUrl()
  @ValidateIf((_, value) => value !== 'oob')
  url: string;

  @IsOptional()
  @IsObject()
  @Type(() => ApplicationRightsDto)
  @ValidateNested()
  rights?: ApplicationRightsDto;
}

export class ApproveAppDto {
  @IsString()
  @MaxLength(255)
  @IsNotEmpty()
  @ValidateIf(dto => !dto.deny)
  token?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @IsNotEmpty()
  @ValidateIf(dto => !dto.token)
  deny?: string;
}

export class CreateApplicationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  @Matches(config.LIMITS.NAME_REGEX)
  name: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  url: string;

  @IsObject()
  @Type(() => ApplicationRightsDto)
  @ValidateNested()
  rights: ApplicationRightsDto;
}
