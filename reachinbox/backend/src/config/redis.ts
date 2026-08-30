import Redis, { RedisOptions } from 'ioredis';

let redisUrl = (process.env.REDIS_URL || 'redis://localhost:6379').trim();
redisUrl = redisUrl.replace(/^["']|["']$/g, '');

export function getRedisOptions(): RedisOptions {
  const isTls = redisUrl.startsWith('rediss://');
  return {
    family: 4,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    connectTimeout: 15000,
    keepAlive: 10000,
    retryStrategy(times: number) {
      return Math.min(times * 100, 3000);
    },
    reconnectOnError() {
      return true;
    },
    tls: isTls ? {
      rejectUnauthorized: false
    } : undefined
  };
}

export function createRedisClient(): Redis {
  return new Redis(redisUrl, getRedisOptions());
}

export const redisConnection = createRedisClient();

redisConnection.on('connect', () => {
  console.log('⚡️ [Redis]: Connected successfully to Upstash.');
});

redisConnection.on('error', (err: Error) => {
  if (err && err.message) {
    console.warn('[Redis Warning]', err.message);
  }
});
