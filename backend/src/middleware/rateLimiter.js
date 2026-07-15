const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { getRedisClient, checkRedisHealth } = require('../config/redis');
const logger = require('../config/logger');

const createLimiter = (windowMs, max, message) => {
  const isRedisActive = checkRedisHealth();
  let store = undefined;

  if (isRedisActive) {
    try {
      const client = getRedisClient();
      store = new RedisStore({
        sendCommand: (...args) => client.sendCommand(args),
      });
    } catch (e) {
      logger.error(`Error initializing Redis rate-limit store: ${e.message}`);
    }
  }

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
    store,
  });
};

const apiLimiter = createLimiter(
  15 * 60 * 1000,
  100,
  'Too many API requests, please try again in 15 minutes.'
);

const authLimiter = createLimiter(
  15 * 60 * 1000,
  15,
  'Too many authentication attempts, please try again in 15 minutes.'
);

module.exports = {
  apiLimiter,
  authLimiter
};
