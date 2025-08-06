import IORedis from 'ioredis';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
};

// Conexão principal para BullMQ
export const redisConnection = new IORedis(redisConfig);

// Conexão para cache geral
export const redisCache = new IORedis(redisConfig);

export default redisConnection;