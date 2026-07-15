const { createClient } = require('redis');
const logger = require('./logger');

let redisClient = null;
let isRedisAvailable = false;

const memoryStore = new Map();

const mockRedisClient = {
  connect: async () => {
    logger.warn('Redis connection bypassed; using in-memory store fallback');
    return Promise.resolve();
  },
  get: async (key) => {
    const entry = memoryStore.get(key);
    if (!entry) return null;
    if (entry.expiry && entry.expiry < Date.now()) {
      memoryStore.delete(key);
      return null;
    }
    return entry.value;
  },
  set: async (key, value, options) => {
    const expiry = options?.EX ? Date.now() + options.EX * 1000 : undefined;
    memoryStore.set(key, { value, expiry });
    return 'OK';
  },
  del: async (key) => {
    memoryStore.delete(key);
    return 1;
  },
  hSet: async (hash, key, value) => {
    const hashKey = `HASH:${hash}`;
    const existing = memoryStore.get(hashKey);
    const subMap = existing ? JSON.parse(existing.value) : {};
    subMap[key] = value;
    memoryStore.set(hashKey, { value: JSON.stringify(subMap) });
    return 1;
  },
  hGet: async (hash, key) => {
    const hashKey = `HASH:${hash}`;
    const entry = memoryStore.get(hashKey);
    if (!entry) return null;
    const subMap = JSON.parse(entry.value);
    return subMap[key] || null;
  },
  hDel: async (hash, key) => {
    const hashKey = `HASH:${hash}`;
    const entry = memoryStore.get(hashKey);
    if (!entry) return 0;
    const subMap = JSON.parse(entry.value);
    delete subMap[key];
    memoryStore.set(hashKey, { value: JSON.stringify(subMap) });
    return 1;
  },
  hGetAll: async (hash) => {
    const hashKey = `HASH:${hash}`;
    const entry = memoryStore.get(hashKey);
    if (!entry) return {};
    return JSON.parse(entry.value);
  },
  on: () => {},
};

const initRedis = async () => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  if (process.env.NODE_ENV === 'test' || redisUrl === 'mock') {
    redisClient = mockRedisClient;
    return;
  }

  try {
    const client = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: () => false,
      },
    });

    client.on('error', (err) => {
      logger.error(`Redis connection error: ${err.message}`);
      if (!isRedisAvailable) {
        logger.warn('Switching to local mock Redis store due to initial connection error');
        redisClient = mockRedisClient;
      }
    });

    await client.connect();
    redisClient = client;
    isRedisAvailable = true;
    logger.info('Redis client connected successfully');
  } catch (error) {
    logger.warn(`Redis connection failed: ${error.message}. Running in-memory cache mode.`);
    redisClient = mockRedisClient;
  }
};

initRedis();

const getRedisClient = () => {
  if (!redisClient) {
    logger.warn('Redis client accessed before initialization. Returning fallback.');
    return mockRedisClient;
  }
  return redisClient;
};

const checkRedisHealth = () => isRedisAvailable;

module.exports = {
  getRedisClient,
  checkRedisHealth,
};
