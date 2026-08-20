import { describe, it, expect, beforeAll } from "vitest";
import { app } from "../index.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

const BASE = "http://test.local";

async function get(path: string) {
  const res = await app.fetch(new Request(`${BASE}${path}`));
  const body = await res.json() as Record<string, unknown>;
  return { status: res.status, body };
}

interface Speech {
  oradorId: number;
  intervencaoId: number;
  dataReuniao: string | null;
  horaInicio: string | null;
  gp: string | null;
  nome: string | null;
  fase: string;
  legislaturaId: string;
  iniciativa: { id: number; numero: string | null; tipo: string | null; titulo: string | null };
  publicacoes: Array<{ tipo: string | null; urlDiario: string | null }>;
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

// Find a deputy who actually spoke in debates. Walking initiatives to discover
// one would be slow, so start from a leg with dense debate data (XIII+) and
// take the first deputy whose intervencoes endpoint returns rows.
let depId: number;
let total: number;

beforeAll(async () => {
  const { body } = await get("/v1/deputados?legislatura=XV&limit=40");
  const rows = body.data as Array<{ id: number }>;
  for (const r of rows) {
    const { body: b } = await get(`/v1/deputados/${r.id}/intervencoes?limit=5`);
    if ((b.total as number) > 0) {
      depId = r.id;
      total = b.total as number;
      break;
    }
  }
  if (!depId) throw new Error("No deputy with debate intervencoes found in sample");
});

// ── Test suite ────────────────────────────────────────────────────────────────

describe("GET /v1/deputados/:id/intervencoes", () => {

  describe("response envelope", () => {
    let body: Record<string, unknown>;
    beforeAll(async () => { ({ body } = await get(`/v1/deputados/${depId}/intervencoes`)); });

    it("returns the standard paginated shape", () => {
      expect(body).toHaveProperty("data");
      expect(body).toHaveProperty("total");
      expect(body).toHaveProperty("page", 1);
      expect(body).toHaveProperty("limit", 50);
      expect(Array.isArray(body.data)).toBe(true);
    });

    it("each row carries the speech, its iniciativa and its DAR refs", () => {
      const row = (body.data as Speech[])[0];
      expect(row).toHaveProperty("oradorId");
      expect(row).toHaveProperty("intervencaoId");
      expect(row).toHaveProperty("dataReuniao");
      expect(row).toHaveProperty("horaInicio");
      expect(row).toHaveProperty("linkVideos");
      expect(row).toHaveProperty("fase");
      expect(row).toHaveProperty("legislaturaId");
      expect(row.iniciativa).toMatchObject({ id: expect.any(Number) });
      expect(Array.isArray(row.publicacoes)).toBe(true);
    });

    it("resolves every row to the requested deputy only", () => {
      // gp/nome come from orador_deputados, so a broken join would surface as
      // rows belonging to somebody else — check the set of names is singular.
      const names = new Set((body.data as Speech[]).map((r) => r.nome));
      expect(names.size).toBeLessThanOrEqual(1);
    });
  });

  describe("ordering", () => {
    it("defaults to newest first", async () => {
      const { body } = await get(`/v1/deputados/${depId}/intervencoes?limit=50`);
      const dates = (body.data as Speech[]).map((r) => r.dataReuniao).filter(Boolean) as string[];
      expect([...dates]).toEqual([...dates].sort().reverse());
    });

    it("honours sort=asc", async () => {
      const { body } = await get(`/v1/deputados/${depId}/intervencoes?limit=50&sort=asc`);
      const dates = (body.data as Speech[]).map((r) => r.dataReuniao).filter(Boolean) as string[];
      expect([...dates]).toEqual([...dates].sort());
    });
  });

  describe("pagination", () => {
    it("limit caps the page and total stays constant", async () => {
      const { body } = await get(`/v1/deputados/${depId}/intervencoes?limit=2`);
      expect((body.data as unknown[]).length).toBeLessThanOrEqual(2);
      expect(body.total).toBe(total);
    });

    it("page 2 does not repeat page 1", async () => {
      if (total < 3) return; // not enough rows to paginate
      const [p1, p2] = await Promise.all([
        get(`/v1/deputados/${depId}/intervencoes?limit=2&page=1`),
        get(`/v1/deputados/${depId}/intervencoes?limit=2&page=2`),
      ]);
      const ids1 = (p1.body.data as Speech[]).map((r) => r.oradorId);
      const ids2 = (p2.body.data as Speech[]).map((r) => r.oradorId);
      expect(ids1.filter((i) => ids2.includes(i))).toEqual([]);
    });
  });

  describe("legislatura filter", () => {
    it("narrows to a single legislatura", async () => {
      const { body } = await get(`/v1/deputados/${depId}/intervencoes?legislatura=XV&limit=50`);
      const legs = new Set((body.data as Speech[]).map((r) => r.legislaturaId));
      expect([...legs].every((l) => l === "XV")).toBe(true);
    });

    it("returns empty for a legislatura the deputy did not speak in", async () => {
      const { body } = await get(`/v1/deputados/${depId}/intervencoes?legislatura=I`);
      expect(body.total).toBe(0);
      expect(body.data).toEqual([]);
    });

    it("returns empty for legislatura V, which has no oradores in the source", async () => {
      const { body } = await get(`/v1/deputados/${depId}/intervencoes?legislatura=V`);
      expect(body.total).toBe(0);
    });
  });

  describe("errors", () => {
    it("returns 400 for a non-numeric id", async () => {
      const { status } = await get("/v1/deputados/abc/intervencoes");
      expect(status).toBe(400);
    });

    it("returns an empty page rather than 404 for an unknown deputy", async () => {
      const { status, body } = await get("/v1/deputados/99999999/intervencoes");
      expect(status).toBe(200);
      expect(body.total).toBe(0);
    });
  });
});
