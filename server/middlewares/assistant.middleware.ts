import { RequestHandler } from 'express';
export function assistantRateLimit(): RequestHandler {
  const buckets = new Map<string, { count: number; expires: number }>();
  return (req, res, next) => {
    const now = Date.now();
    for (const [key, value] of buckets) if (value.expires <= now) buckets.delete(key);
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const bucket = buckets.get(key) || { count: 0, expires: now + 60000 };
    if (bucket.count >= 12 || (!buckets.has(key) && buckets.size >= 10000)) {
      res.setHeader('Retry-After', Math.max(1, Math.ceil((bucket.expires - now) / 1000)));
      res.status(429).json({ code: 'RATE_LIMITED', error: 'Quá nhiều yêu cầu. Vui lòng chờ một phút.' }); return;
    }
    bucket.count++; buckets.set(key, bucket); next();
  };
}
