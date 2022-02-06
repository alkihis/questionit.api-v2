
export interface ISentToken {
  jti: string;
  createdAt: string;
  lastUsedAt: string;
  createdWithIp: string;
  current?: boolean;
}

export interface IRequestTokenData {
  rights: number;
  id: string;
}
