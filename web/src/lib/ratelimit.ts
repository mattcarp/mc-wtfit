import 'server-only';

// Tiny in-memory fixed-window limiter. Good enough for one box; swap for Redis if you scale out.
const hits = new Map<string, { n: number; reset: number }>();

export function limited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.reset < now) { hits.set(key, { n: 1, reset: now + windowMs }); return false; }
  h.n++;
  return h.n > max;
}

export function clientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
}
