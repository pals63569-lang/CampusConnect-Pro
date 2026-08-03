const logger = require('../../utils/logger');

/**
 * In-Memory & Redis Caching Service Abstraction.
 * Gracefully falls back to Memory cache if Redis is not configured.
 */
class CacheService {
  constructor() {
    this.memoryCache = new Map();
    this.redisClient = null;
    this.isRedisConnected = false;
  }

  async get(key) {
    try {
      if (this.isRedisConnected && this.redisClient) {
        const data = await this.redisClient.get(key);
        return data ? JSON.parse(data) : null;
      }
    } catch (_err) {
      // Ignore redis error and fall back
    }

    const item = this.memoryCache.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      this.memoryCache.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key, value, ttlInSeconds = 60) {
    try {
      if (this.isRedisConnected && this.redisClient) {
        await this.redisClient.setex(key, ttlInSeconds, JSON.stringify(value));
        return;
      }
    } catch (_err) {
      // Ignore redis error and fall back
    }

    const expiry = ttlInSeconds ? Date.now() + ttlInSeconds * 1000 : null;
    this.memoryCache.set(key, { value, expiry });
  }

  async del(key) {
    try {
      if (this.isRedisConnected && this.redisClient) {
        await this.redisClient.del(key);
      }
    } catch (_err) {
      // Ignore
    }
    this.memoryCache.delete(key);
  }

  async delByPattern(patternPrefix) {
    try {
      if (this.isRedisConnected && this.redisClient) {
        const keys = await this.redisClient.keys(`${patternPrefix}*`);
        if (keys.length > 0) {
          await this.redisClient.del(keys);
        }
      }
    } catch (_err) {
      // Ignore
    }

    const prefix = patternPrefix.replace('*', '');
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
      }
    }
  }
}

module.exports = new CacheService();
