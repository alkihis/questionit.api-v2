import config from '../config/config';

export function isAppTokenExpired(date: Date) {
  return date.getTime() + config.LIMITS.APP_REQUEST_TOKEN_EXPIRATION < Date.now();
}
