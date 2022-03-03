import * as path from 'path';

const rootDir = path.resolve(__dirname, '..', '..', '..');

const config = {
  URL: process.env.QUESTIONIT_API_URL || 'http://localhost:5001',
  WEB_URL: process.env.WEB_URL || 'http://localhost:5002',
  ROOT_DIR: rootDir,
  DB: {
    USER: process.env.DB_USER || 'questionit',
    PASSWORD: process.env.DB_PASSWORD || 'questionit',
    HOST: process.env.DB_HOST || 'postgres',
    DATABASE: process.env.DB_DATABASE || 'questionit',
    LOGGING: true,
  },
  JWT: {
    SECRET: process.env.APP_SECRET || 'questionit',
  },
  LIMITS: {
    QUESTION_LENGTH: 500,
    ANSWER_LENGTH: 600,
    ASK_ME_MESSAGE_LIMIT: 60,
    SLUG_LENGTH: 20,
    POLL_OPTION_LENGTH: 32,
    SLUG_REGEX: /^[a-z_-][a-z0-9_-]{1,19}$/i,
    NAME_REGEX: /^.{2,32}$/i,
    BLOCKED_WORDS_REGEX: /^[\p{L}\p{N}_. -]{2,32}$/iu,
    FILE_SIZE: 5 * 1024 * 1024,
    ANSWER_PICTURE_FILE_SIZE: 2.5 * 1024 * 1024,
    ANSWER_GIF_FILE_SIZE: 30 * 1024 * 1024,
    APP_REQUEST_TOKEN_EXPIRATION: 15 * 60 * 1000, // 15 minutes
    APPS_PER_USER: 5,
    MAX_NEW_LINES_IN_QUESTIONS: 12,
  },
  REDIS: {
    HOST: process.env.REDIS_HOST || 'redis-single',
    PASSWORD: process.env.REDIS_PASSWORD || 'questionit',
    PORT: Number(process.env.REDIS_PORT) || 6379,
  },
  RATE_LIMITING: {
    // 10 minutes
    DEFAULT_TTL: 600,
    // 150 requests per {DEFAULT_TTL}
    DEFAULT_LIMIT: 150,
  },
  /**
   * Generated once with the following code.
   * This should be done only one time, you can use the node console on the repository root directory.
   *
   * ```js
   * const push = require('web-push');
   * push.generateVAPIDKeys(); // => { publicKey: '', privateKey: '' }
   * ```
   */
  VAPID: {
    PUBLIC: process.env.VAPID_PUBLIC_KEY,
    PRIVATE: process.env.VAPID_SECRET_KEY,
    EMAIL: process.env.VAPID_RELATED_EMAIL || 'mailto:noreply@questionit.space',
  },
  TWITTER: {
    CONSUMER_KEY: process.env.OAUTH_CONSUMER_KEY,
    CONSUMER_SECRET: process.env.OAUTH_CONSUMER_SECRET,
    OAUTH_TOKEN: process.env.OAUTH_DEFAULT_TOKEN,
    OAUTH_SECRET: process.env.OAUTH_DEFAULT_SECRET,
    CALLBACK_URL: process.env.TWITTER_CALLBACK_URL || `${process.env.WEB_URL || 'http://localhost:5002'}/t_callback`,
  },
  UPLOAD: {
    PROFILE_PICTURES: path.resolve(rootDir, 'uploads', 'profile-pictures'),
    BANNERS: path.resolve(rootDir, 'uploads', 'banners'),
    ANSWER_PICTURES: path.resolve(rootDir, 'uploads', 'answer-pictures'),
    TEMPORARY: path.resolve(rootDir, 'uploads', 'temp'),
    FILE_PROCESSING: path.resolve(rootDir, 'uploads', 'file-processing'),
  },
  DATA: {
    BANNED_IPS: path.resolve(rootDir, 'data', 'banned.ips.json'),
    BANNED_WORDS: path.resolve(rootDir, 'data', 'banned.words.json'),
  },
  WORKERS: {
    IMAGE_CONVERTOR: path.resolve(rootDir, 'dist', 'shared', 'workers', 'image.convertor.worker.js'),
    MUTED_WORDS: path.resolve(rootDir, 'dist', 'shared', 'workers', 'muted.words.worker.js'),
  },
  DAY_QUESTIONS: {
    FORCED_CURRENT: null as number | null,
    LANGUAGES: ['fr', 'en'],
  },
} as const;

export default config;
