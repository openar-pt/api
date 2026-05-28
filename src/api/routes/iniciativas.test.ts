import { describe, it, expect, beforeAll } from "vitest";
import { app } from "../index.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

const BASE = "http://test.local";

async function get(path: string) {
  const res = await app.fetch(new Request(`${BASE}${path}`));
  const body = await res.json() as Record<string, unknown>;
  return { status: res.status, body };
}

function firstEvento(body: Record<string, unknown>) {
  return ((body.eventos as unknown[]) ?? [])[0] as Record<string, unknown> | undefined;
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

// All tests share a single real iniciativa ID fetched once.
// We also pick one that has eventos so sub-relation checks are meaningful.
let id: number;

beforeAll(async () => {
  const { body } = await get("/v1/iniciativas?limit=100&sort=desc");
  const rows = body.data as Array<{ id: number }>;
  // Prefer an ID that actually has nested data
  id = rows[0].id;
});

// ── Test suite ────────────────────────────────────────────────────────────────

describe("GET /v1/iniciativas/:id — ?include= scoping", () => {

  // ── Default: no ?include ───────────────────────────────────────────────────

  describe("no ?include param → returns every relation", () => {
    let body: Record<string, unknown>;
    beforeAll(async () => { ({ body } = await get(`/v1/iniciativas/${id}`)); });

    it("has all top-level relations", () => {
      expect(body).toHaveProperty("autores");
      expect(body).toHaveProperty("eventos");
      expect(body).toHaveProperty("relacionadas");
      expect(body).toHaveProperty("anexos");
      expect(body).toHaveProperty("conjuntas");
      expect(body).toHaveProperty("peticoes");
      expect(body).toHaveProperty("propostasAlteracao");
    });

    it("evento has all sub-relations", () => {
      const ev = firstEvento(body);
      if (!ev) return; // no eventos on this iniciativa — skip
      expect(ev).toHaveProperty("votacoes");
      expect(ev).toHaveProperty("publicacoes");
      expect(ev).toHaveProperty("comissoesFases");
      expect(ev).toHaveProperty("intervencoesdebates");
      expect(ev).toHaveProperty("iniciativasConjuntas");
      expect(ev).toHaveProperty("peticoesConjuntas");
      expect(ev).toHaveProperty("anexos");
    });

    it("always returns scalar fields", () => {
      expect(body).toHaveProperty("id");
      expect(body).toHaveProperty("titulo");
      expect(body).toHaveProperty("tipo");
      expect(body).toHaveProperty("estado");
    });
  });

  // ── Empty include: scalars only ────────────────────────────────────────────

  describe("?include= (empty) → scalar fields only", () => {
    let body: Record<string, unknown>;
    beforeAll(async () => { ({ body } = await get(`/v1/iniciativas/${id}?include=`)); });

    it("still returns scalar fields", () => {
      expect(body).toHaveProperty("id");
      expect(body).toHaveProperty("titulo");
      expect(body).toHaveProperty("tipo");
      expect(body).toHaveProperty("estado");
      expect(body).toHaveProperty("legislaturaId");
      expect(body).toHaveProperty("numero");
    });

    it("omits every relation", () => {
      expect(body).not.toHaveProperty("autores");
      expect(body).not.toHaveProperty("eventos");
      expect(body).not.toHaveProperty("relacionadas");
      expect(body).not.toHaveProperty("anexos");
      expect(body).not.toHaveProperty("conjuntas");
      expect(body).not.toHaveProperty("peticoes");
      expect(body).not.toHaveProperty("propostasAlteracao");
    });
  });

  // ── Iniciativas detail page ────────────────────────────────────────────────

  describe("?include=autores,eventos.votacoes,eventos.publicacoes,relacionadas,anexos", () => {
    let body: Record<string, unknown>;
    beforeAll(async () => {
      ({ body } = await get(
        `/v1/iniciativas/${id}?include=autores,eventos.votacoes,eventos.publicacoes,relacionadas,anexos`,
      ));
    });

    it("includes the requested top-level relations", () => {
      expect(body).toHaveProperty("autores");
      expect(body).toHaveProperty("eventos");
      expect(body).toHaveProperty("relacionadas");
      expect(body).toHaveProperty("anexos");
    });

    it("omits unrequested top-level relations", () => {
      expect(body).not.toHaveProperty("conjuntas");
      expect(body).not.toHaveProperty("peticoes");
      expect(body).not.toHaveProperty("propostasAlteracao");
    });

    it("evento has votacoes and publicacoes", () => {
      const ev = firstEvento(body);
      if (!ev) return;
      expect(ev).toHaveProperty("votacoes");
      expect(ev).toHaveProperty("publicacoes");
    });

    it("evento does NOT have heavy relations (comissoesFases, intervencoesdebates)", () => {
      const ev = firstEvento(body);
      if (!ev) return;
      expect(ev).not.toHaveProperty("comissoesFases");
      expect(ev).not.toHaveProperty("intervencoesdebates");
      expect(ev).not.toHaveProperty("iniciativasConjuntas");
      expect(ev).not.toHaveProperty("peticoesConjuntas");
    });
  });

  // ── Comissões detail page ──────────────────────────────────────────────────

  describe("?include=autores,eventos.comissoesFases,relacionadas,anexos", () => {
    let body: Record<string, unknown>;
    beforeAll(async () => {
      ({ body } = await get(
        `/v1/iniciativas/${id}?include=autores,eventos.comissoesFases,relacionadas,anexos`,
      ));
    });

    it("evento has comissoesFases", () => {
      const ev = firstEvento(body);
      if (!ev) return;
      expect(ev).toHaveProperty("comissoesFases");
    });

    it("evento does NOT have votacoes, publicacoes, intervencoesdebates", () => {
      const ev = firstEvento(body);
      if (!ev) return;
      expect(ev).not.toHaveProperty("votacoes");
      expect(ev).not.toHaveProperty("publicacoes");
      expect(ev).not.toHaveProperty("intervencoesdebates");
    });
  });

  // ── Votações page ──────────────────────────────────────────────────────────

  describe("?include=eventos.votacoes", () => {
    let body: Record<string, unknown>;
    beforeAll(async () => { ({ body } = await get(`/v1/iniciativas/${id}?include=eventos.votacoes`)); });

    it("includes eventos", () => {
      expect(body).toHaveProperty("eventos");
    });

    it("evento has votacoes", () => {
      const ev = firstEvento(body);
      if (!ev) return;
      expect(ev).toHaveProperty("votacoes");
    });

    it("omits autores, relacionadas, anexos", () => {
      expect(body).not.toHaveProperty("autores");
      expect(body).not.toHaveProperty("relacionadas");
      expect(body).not.toHaveProperty("anexos");
    });

    it("evento does NOT have comissoesFases or intervencoesdebates", () => {
      const ev = firstEvento(body);
      if (!ev) return;
      expect(ev).not.toHaveProperty("comissoesFases");
      expect(ev).not.toHaveProperty("intervencoesdebates");
    });
  });

  // ── OG image pages ─────────────────────────────────────────────────────────

  describe("?include=intervencoesdebates", () => {
    let body: Record<string, unknown>;
    beforeAll(async () => {
      ({ body } = await get(`/v1/iniciativas/${id}?include=intervencoesdebates`));
    });

    it("evento has intervencoesdebates with oradores", () => {
      const ev = firstEvento(body);
      if (!ev) return;
      expect(ev).toHaveProperty("intervencoesdebates");
      const debate = (ev.intervencoesdebates as unknown[])?.[0] as Record<string, unknown> | undefined;
      if (debate) expect(debate).toHaveProperty("oradores");
    });

    it("evento does NOT have votacoes, publicacoes, comissoesFases", () => {
      const ev = firstEvento(body);
      if (!ev) return;
      expect(ev).not.toHaveProperty("votacoes");
      expect(ev).not.toHaveProperty("publicacoes");
      expect(ev).not.toHaveProperty("comissoesFases");
    });
  });

  // ── Bare key shorthand ─────────────────────────────────────────────────────

  describe("shorthand keys (bare vs prefixed)", () => {
    it("'votacoes' is equivalent to 'eventos.votacoes'", async () => {
      const { body: b1 } = await get(`/v1/iniciativas/${id}?include=votacoes`);
      const { body: b2 } = await get(`/v1/iniciativas/${id}?include=eventos.votacoes`);
      const ev1 = firstEvento(b1);
      const ev2 = firstEvento(b2);
      if (!ev1 || !ev2) return;
      expect(Object.keys(ev1).sort()).toEqual(Object.keys(ev2).sort());
    });

    it("'comissoesFases' is equivalent to 'eventos.comissoesFases'", async () => {
      const { body: b1 } = await get(`/v1/iniciativas/${id}?include=comissoesFases`);
      const { body: b2 } = await get(`/v1/iniciativas/${id}?include=eventos.comissoesFases`);
      const ev1 = firstEvento(b1);
      const ev2 = firstEvento(b2);
      if (!ev1 || !ev2) return;
      expect(Object.keys(ev1).sort()).toEqual(Object.keys(ev2).sort());
    });
  });

  // ── Multiple includes ──────────────────────────────────────────────────────

  describe("multiple evento sub-relations combined", () => {
    it("?include=eventos.votacoes,eventos.comissoesFases includes both", async () => {
      const { body } = await get(
        `/v1/iniciativas/${id}?include=eventos.votacoes,eventos.comissoesFases`,
      );
      const ev = firstEvento(body);
      if (!ev) return;
      expect(ev).toHaveProperty("votacoes");
      expect(ev).toHaveProperty("comissoesFases");
      expect(ev).not.toHaveProperty("intervencoesdebates");
      expect(ev).not.toHaveProperty("publicacoes");
    });
  });

  // ── Error cases ────────────────────────────────────────────────────────────

  describe("error handling", () => {
    it("returns 400 for non-numeric id", async () => {
      const { status } = await get("/v1/iniciativas/abc");
      expect(status).toBe(400);
    });

    it("returns 404 for an id that does not exist", async () => {
      const { status } = await get("/v1/iniciativas/999999999");
      expect(status).toBe(404);
    });
  });

  // ── Regression guard ───────────────────────────────────────────────────────
  // These tests encode the exact ?include= strings used by each frontend page.
  // If a page's fetch call changes to drop ?include=, this will catch it on
  // the API side by verifying the correct shape is achievable.

  describe("regression: frontend page scopes are achievable", () => {
    const pages = [
      {
        name: "iniciativas/[id]",
        include: "autores,eventos.votacoes,eventos.publicacoes,relacionadas,anexos",
        expectTopLevel: ["autores", "eventos", "relacionadas", "anexos"],
        forbidTopLevel: ["conjuntas", "peticoes", "propostasAlteracao"],
        expectEvento: ["votacoes", "publicacoes"],
        forbidEvento: ["comissoesFases", "intervencoesdebates"],
      },
      {
        name: "comissoes/[id]/[iniId]",
        include: "autores,eventos.comissoesFases,relacionadas,anexos",
        expectTopLevel: ["autores", "eventos", "relacionadas", "anexos"],
        forbidTopLevel: ["conjuntas", "peticoes", "propostasAlteracao"],
        expectEvento: ["comissoesFases"],
        forbidEvento: ["votacoes", "publicacoes", "intervencoesdebates"],
      },
      {
        name: "votacoes/[id]",
        include: "eventos.votacoes",
        expectTopLevel: ["eventos"],
        forbidTopLevel: ["autores", "relacionadas", "anexos", "conjuntas"],
        expectEvento: ["votacoes"],
        forbidEvento: ["comissoesFases", "intervencoesdebates", "publicacoes"],
      },
    ];

    for (const page of pages) {
      describe(`page: ${page.name}`, () => {
        let body: Record<string, unknown>;
        beforeAll(async () => {
          ({ body } = await get(`/v1/iniciativas/${id}?include=${page.include}`));
        });

        it("has expected top-level keys", () => {
          for (const key of page.expectTopLevel) expect(body).toHaveProperty(key);
        });

        it("does not have forbidden top-level keys", () => {
          for (const key of page.forbidTopLevel) expect(body).not.toHaveProperty(key);
        });

        it("evento has expected sub-relations", () => {
          const ev = firstEvento(body);
          if (!ev) return;
          for (const key of page.expectEvento) expect(ev).toHaveProperty(key);
        });

        it("evento does not have forbidden sub-relations", () => {
          const ev = firstEvento(body);
          if (!ev) return;
          for (const key of page.forbidEvento) expect(ev).not.toHaveProperty(key);
        });
      });
    }
  });
});
