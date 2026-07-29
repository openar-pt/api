import { describe, it, expect, beforeAll } from "vitest";
import { app } from "../index.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

const BASE = "http://test.local";

async function get(path: string) {
  const res = await app.fetch(new Request(`${BASE}${path}`));
  const body = await res.json() as Record<string, unknown>;
  return { status: res.status, body };
}

function firstComissao(body: Record<string, unknown>) {
  return ((body.comissoes as unknown[]) ?? [])[0] as Record<string, unknown> | undefined;
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

// Share one real petition id, preferring one that has committees so the
// sub-relation checks are meaningful.
let id: number;

beforeAll(async () => {
  const { body } = await get("/v1/peticoes?limit=100&sort=desc");
  const rows = body.data as Array<{ id: number }>;
  id = rows[0].id;
});

// ── Test suite ────────────────────────────────────────────────────────────────

describe("GET /v1/peticoes/:id — ?include= scoping", () => {

  describe("no ?include param → returns every relation", () => {
    let body: Record<string, unknown>;
    beforeAll(async () => { ({ body } = await get(`/v1/peticoes/${id}`)); });

    it("has all top-level relations", () => {
      expect(body).toHaveProperty("comissoes");
      expect(body).toHaveProperty("documentos");
      expect(body).toHaveProperty("publicacoes");
      expect(body).toHaveProperty("relacionadas");
    });

    it("comissao has all sub-relations", () => {
      const cms = firstComissao(body);
      if (!cms) return; // no comissoes on this petition — skip
      expect(cms).toHaveProperty("relatores");
      expect(cms).toHaveProperty("relatorioFinal");
      expect(cms).toHaveProperty("documentos");
      expect(cms).toHaveProperty("audicoes");
      expect(cms).toHaveProperty("pedidosInformacao");
    });

    it("always returns scalar fields", () => {
      expect(body).toHaveProperty("id");
      expect(body).toHaveProperty("assunto");
      expect(body).toHaveProperty("situacao");
      expect(body).toHaveProperty("legislaturaId");
    });
  });

  describe("?include= (empty) → scalar fields only", () => {
    let body: Record<string, unknown>;
    beforeAll(async () => { ({ body } = await get(`/v1/peticoes/${id}?include=`)); });

    it("still returns scalar fields", () => {
      expect(body).toHaveProperty("id");
      expect(body).toHaveProperty("assunto");
      expect(body).toHaveProperty("numero");
      expect(body).toHaveProperty("legislaturaId");
    });

    it("omits every relation", () => {
      expect(body).not.toHaveProperty("comissoes");
      expect(body).not.toHaveProperty("documentos");
      expect(body).not.toHaveProperty("publicacoes");
      expect(body).not.toHaveProperty("relacionadas");
    });
  });

  describe("?include=documentos,publicacoes", () => {
    let body: Record<string, unknown>;
    beforeAll(async () => { ({ body } = await get(`/v1/peticoes/${id}?include=documentos,publicacoes`)); });

    it("includes the requested relations", () => {
      expect(body).toHaveProperty("documentos");
      expect(body).toHaveProperty("publicacoes");
    });

    it("omits the others", () => {
      expect(body).not.toHaveProperty("comissoes");
      expect(body).not.toHaveProperty("relacionadas");
    });
  });

  // A sub-relation pulls in its parent, mirroring eventos in /iniciativas/:id.
  describe("?include=comissoes.relatorioFinal", () => {
    let body: Record<string, unknown>;
    beforeAll(async () => { ({ body } = await get(`/v1/peticoes/${id}?include=comissoes.relatorioFinal`)); });

    it("brings comissoes along automatically", () => {
      expect(body).toHaveProperty("comissoes");
    });

    it("includes only the requested sub-relation", () => {
      const cms = firstComissao(body);
      if (!cms) return;
      expect(cms).toHaveProperty("relatorioFinal");
      expect(cms).not.toHaveProperty("relatores");
      expect(cms).not.toHaveProperty("audicoes");
      expect(cms).not.toHaveProperty("pedidosInformacao");
    });

    it("omits unrelated top-level relations", () => {
      expect(body).not.toHaveProperty("documentos");
      expect(body).not.toHaveProperty("publicacoes");
    });
  });

  // `documentos` is ambiguous: bare means top-level, never the committee one.
  describe("bare `documentos` always means the top-level relation", () => {
    let body: Record<string, unknown>;
    beforeAll(async () => { ({ body } = await get(`/v1/peticoes/${id}?include=documentos`)); });

    it("returns the top-level documentos", () => {
      expect(body).toHaveProperty("documentos");
    });

    it("does not pull in comissoes", () => {
      expect(body).not.toHaveProperty("comissoes");
    });
  });

  describe("short form of a comissao sub-relation", () => {
    let body: Record<string, unknown>;
    beforeAll(async () => { ({ body } = await get(`/v1/peticoes/${id}?include=relatores`)); });

    it("`relatores` ≡ `comissoes.relatores`", () => {
      expect(body).toHaveProperty("comissoes");
      const cms = firstComissao(body);
      if (!cms) return;
      expect(cms).toHaveProperty("relatores");
      expect(cms).not.toHaveProperty("audicoes");
    });
  });

  describe("errors", () => {
    it("returns 400 for non-numeric id", async () => {
      const { status } = await get("/v1/peticoes/abc");
      expect(status).toBe(400);
    });

    it("returns 404 for an unknown id", async () => {
      const { status } = await get("/v1/peticoes/999999999");
      expect(status).toBe(404);
    });

    it("returns 400 for an unknown include key", async () => {
      const { status, body } = await get(`/v1/peticoes/${id}?include=naoexiste`);
      expect(status).toBe(400);
      expect(body.error).toContain("naoexiste");
      expect(body.valid).toContain("comissoes");
    });

    it("returns 400 for a misspelled comissao prefix", async () => {
      const { status } = await get(`/v1/peticoes/${id}?include=comissao.relatores`);
      expect(status).toBe(400);
    });
  });
});
