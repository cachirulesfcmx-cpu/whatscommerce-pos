import { getRedis } from "@/lib/security/redis";

type Bucket = { count: number; resetAt: number };
const memory = new Map<string, Bucket>();

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

/**
 * Fixed-window rate limiter. Uses Redis when available, otherwise an
 * in-memory map (fine for single-instance dev / small deploys).
 */
export async function rateLimit(
  key: string,
  limit = 30,
  windowSec = 60
): Promise<RateLimitResult> {
  const now = Date.now();
  const redis = getRedis();

  if (redis) {
    const redisKey = `rl:${key}`;
    const count = await redis.incr(redisKey);
    if (count === 1) await redis.expire(redisKey, windowSec);
    const ttl = await redis.ttl(redisKey);
    return {
      success: count <= limit,
      remaining: Math.max(0, limit - count),
      reset: now + ttl * 1000,
    };
  }

  const bucket = memory.get(key);
  if (!bucket || bucket.resetAt < now) {
    memory.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return { success: true, remaining: limit - 1, reset: now + windowSec * 1000 };
  }
  bucket.count += 1;
  return {
    success: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    reset: bucket.resetAt,
  };
}

export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
