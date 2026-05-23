import { redis } from "./redis";

const DEFAULT_TTL = 60;

export const cache = {
  async get(key: string): Promise<string | null> {
    try {
      return await redis.get(key);
    } catch {
      return null;
    }
  },

  async set(key: string, value: string, ttl = DEFAULT_TTL): Promise<void> {
    try {
      await redis.setex(key, ttl, value);
    } catch {}
  },

  async del(key: string): Promise<void> {
    try {
      await redis.del(key);
    } catch {}
  },

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) await redis.del(...keys);
    } catch {}
  },
};
