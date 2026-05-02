type Entry = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Entry>();

export function checkRateLimit(
  key: string,
  maxRequests = 10,
  windowMs = 60_000,
) {
  const now = Date.now();
  const current = buckets.get(key);

  if (!current || current.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (current.count >= maxRequests) {
    return { allowed: false, remaining: 0, retryAfter: current.resetAt - now };
  }

  current.count += 1;
  buckets.set(key, current);
  return { allowed: true, remaining: maxRequests - current.count };
}
