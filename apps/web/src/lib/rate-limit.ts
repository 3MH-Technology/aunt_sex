import { redis } from "./redis";

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
}

const defaults: RateLimitConfig = {
  windowMs: 60 * 1000,
  max: 30,
  message: "طلبات كثيرة جداً. حاول مرة أخرى بعد دقيقة.",
};

export async function rateLimit(
  identifier: string,
  config: Partial<RateLimitConfig> = {}
): Promise<{ limited: boolean; remaining: number }> {
  const { windowMs, max, message } = { ...defaults, ...config };
  const key = `ratelimit:${identifier}`;

  if (!redis) return { limited: false, remaining: Infinity };
  try {
    const current = await redis.incr(key);
    if (current === 1) {
      await redis.pexpire(key, windowMs);
    }

    if (current > max) {
      return { limited: true, remaining: 0 };
    }

    return { limited: false, remaining: max - current };
  } catch {
    return { limited: true, remaining: 0 };
  }
}
