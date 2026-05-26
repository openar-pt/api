import type { Context } from "hono";

export function parsePage(c: Context) {
  const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(c.req.query("limit") ?? "50", 10) || 50));
  return { page, limit, offset: (page - 1) * limit };
}

export function weakEtag(d: Date): string {
  return `W/"${d.getTime().toString(36)}"`;
}
