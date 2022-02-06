import Redis from 'ioredis';
import config from '../../config/config';

const redis = new Redis({
  port: 6379,
  host: config.REDIS.HOST,
  password: config.REDIS.PASSWORD,
  db: 0,
});

export enum ERedisPrefix {
  TwitterOAuthSecret = 'twitter-oauth-secret-',
  FollowNotification = 'follow-notification-',
}

export enum ERedisExpiration {
  TwitterOAuthSecret = 60 * 20,
  FollowNotification = 60 * 60 * 3,
}

export class RedisService {
  static get client() {
    return redis;
  }

  static async getObject(key: string) {
    const data = await this.client.get(key);

    if (data) {
      return JSON.parse(data);
    } {
      return undefined;
    }
  }

  static async setObject(key: string, value: object, ttl: number) {
    await this.client.set(key, JSON.stringify(value), 'EX', ttl);
  }

  static async deleteObject(key: string) {
    await this.client.del(key);
  }

  static async ttl(key: string) {
    return await this.client.pttl(key);
  }
}
