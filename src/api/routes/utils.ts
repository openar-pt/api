import type { Context } from "hono";

export function parsePage(c: Context) {
  const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(c.req.query("limit") ?? "50", 10) || 50));
  return { page, limit, offset: (page - 1) * limit };
}

export function weakEtag(d: Date): string {
  return `W/"${d.getTime().toString(36)}"`;
}

// ETL runs periodically so responses are safe to cache at the edge.
// 5 min fresh + 1 hr stale-while-revalidate absorbs traffic spikes without
// serving stale data for too long.
export function setCache(c: Context, ttl: "short" | "long" = "short") {
  const maxAge = ttl === "long" ? 3600 : 300;
  const swr    = ttl === "long" ? 86400 : 3600;
  c.header("Cache-Control", `public, max-age=${maxAge}, stale-while-revalidate=${swr}`);
}

// For detail endpoints that already have an ETag: set cache + handle 304.
// Returns true if the request was served as 304 (caller should return early).
export function setCacheWithEtag(c: Context, updatedAt: Date): boolean {
  const etag = weakEtag(updatedAt);
  c.header("ETag", etag);
  setCache(c);
  if (c.req.header("if-none-match") === etag) {
    c.status(304);
    return true;
  }
  return false;
}
