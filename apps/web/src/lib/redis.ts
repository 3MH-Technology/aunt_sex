import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let redis: Redis;

declare global {
  var __redis: Redis | undefined;
}

function createRedis() {
  const client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    retryStrategy: (times) => Math.min(times * 100, 3000),
    lazyConnect: true,
    connectTimeout: 5000,
    enableOfflineQueue: false,
  });
  client.on("error", () => {});
  return client;
}

if (process.env.NODE_ENV === "production") {
  redis = createRedis();
} else {
  if (!global.__redis) {
    global.__redis = createRedis();
  }
  redis = global.__redis;
}

export { redis };
