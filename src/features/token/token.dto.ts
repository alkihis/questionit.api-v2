import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTokenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  key: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  token: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  validator: string;
}

export class GetAccessTokenDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  oauthToken: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  oauthVerifier: string;
}
