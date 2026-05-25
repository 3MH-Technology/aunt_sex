import { redis } from "./redis";

const DEFAULT_TTL = 60;

export const cache = {
  async get(key: string): Promise<string | null> {
    if (!redis) return null;
    try {
      return await redis.get(key);
    } catch {
      return null;
    }
  },

  async set(key: string, value: string, ttl = DEFAULT_TTL): Promise<void> {
    if (!redis) return;
    try {
      await redis.setex(key, ttl, value);
    } catch {}
  },

  async del(key: string): Promise<void> {
    if (!redis) return;
    try {
      await redis.del(key);
    } catch {}
  },

  async delPattern(pattern: string): Promise<void> {
    if (!redis) return;
    try {
      let cursor = "0";
      do {
        const [nextCursor, ...keySets] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
        cursor = nextCursor;
        const keys = keySets.flat();
        if (keys.length > 0) {
          const pipeline = redis.pipeline();
          for (const key of keys) {
            pipeline.del(key);
          }
          await pipeline.exec();
        }
      } while (cursor !== "0");
    } catch {}
  },
};
