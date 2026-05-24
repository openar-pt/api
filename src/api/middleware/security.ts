import type { MiddlewareHandler } from "hono";

// ── Rate limiter ──────────────────────────────────────────────────────────────
// Sliding window, in-memory. Single process — no Redis needed.

const store = new Map<string, number[]>();
const LIMIT = 100;       // requests per window
const WINDOW = 60_000;   // 1 minute

// Prevent unbounded growth from many unique IPs
setInterval(() => {
  const now = Date.now();
  for (const [key, times] of store.entries()) {
    const fresh = times.filter((t) => now - t < WINDOW);
    if (fresh.length === 0) store.delete(key);
    else store.set(key, fresh);
  }
}, 5 * 60_000).unref();

function clientIp(c: Parameters<MiddlewareHandler>[0]): string {
  return (
    c.req.header("cf-connecting-ip") ??
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("x-real-ip") ??
    "unknown"
  );
}

export function rateLimiter(): MiddlewareHandler {
  return async (c, next) => {
    const ip = clientIp(c);
    const now = Date.now();
    const times = (store.get(ip) ?? []).filter((t) => now - t < WINDOW);

    c.header("X-RateLimit-Limit", String(LIMIT));
    c.header("X-RateLimit-Remaining", String(Math.max(0, LIMIT - times.length)));

    if (times.length >= LIMIT) {
      c.header("Retry-After", "60");
      return c.json({ error: "Too many requests" }, 429);
    }

    times.push(now);
    store.set(ip, times);
    await next();
  };
}

// ── Input validation ──────────────────────────────────────────────────────────

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DATE_PARAMS = ["dataEntradaDe", "dataEntradaAte", "data_inicio", "data_fim"];
const MAX_QUERY_STRING = 500;
const MAX_Q_LENGTH = 100;

export function validateInput(): MiddlewareHandler {
  return async (c, next) => {
    const url = new URL(c.req.url);

    if (url.search.length > MAX_QUERY_STRING) {
      return c.json({ error: "Query string too long" }, 400);
    }

    const q = c.req.query("q");
    if (q && q.length > MAX_Q_LENGTH) {
      return c.json({ error: `'q' must be at most ${MAX_Q_LENGTH} characters` }, 400);
    }

    for (const param of DATE_PARAMS) {
      const val = c.req.query(param);
      if (val && !DATE_RE.test(val)) {
        return c.json({ error: `'${param}' must be in YYYY-MM-DD format` }, 400);
      }
    }

    await next();
  };
}
