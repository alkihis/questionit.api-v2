import { IsInt, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateSubscriptionDto {
  @IsOptional()
  @IsString()
  endpoint?: string;

  @IsOptional()
  @IsObject()
  keys?: Record<string, string>;

  @IsOptional()
  expirationTime?: null | number;
}

export class UpdateSubscriptionDto {
  @IsString()
  endpoint: string;

  @IsInt()
  target: number;

  @IsString()
  token: string;
}
