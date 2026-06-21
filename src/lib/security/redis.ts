import Redis from "ioredis";

let _redis: Redis | null = null;

/** Returns a shared Redis client, or null if REDIS_URL isn't configured. */
export function getRedis(): Redis | null {
  if (!process.env.REDIS_URL) return null;
  if (!_redis) {
    _redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      lazyConnect: false,
    });
    _redis.on("error", () => {
      /* swallow — features degrade gracefully */
    });
  }
  return _redis;
}
