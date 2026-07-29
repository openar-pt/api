import { Hono } from "hono";
import { and, asc, eq, gte, ilike, lte, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import * as t from "../../db/schema.js";
import { parseDateRange, parsePage, parseSort, setCache, setCacheWithEtag } from "./utils.js";

const app = new Hono();

// GET /peticoes?legislatura=XVII&situacao=...&q=...&data_inicio=2025-01-01&data_fim=2025-12-31&updated_since=2026-05-01T00:00:00Z&page=1&limit=50
app.get("/", async (c) => {
  const { page, limit, offset } = parsePage(c);
  const legislatura = c.req.query("legislatura");
  const situacao = c.req.query("situacao");
  const updatedSince = c.req.query("updated_since");
  const { from: dataDe, to: dataAte } = parseDateRange(c);
  const q = c.req.query("q");

  const filters = and(
    legislatura ? eq(t.peticoes.legislaturaId, legislatura) : undefined,
    situacao ? eq(t.peticoes.situacao, situacao) : undefined,
    dataDe ? gte(t.peticoes.dataEntrada, dataDe) : undefined,
    dataAte ? lte(t.peticoes.dataEntrada, dataAte) : undefined,
    updatedSince ? gte(t.peticoes.updatedAt, new Date(updatedSince)) : undefined,
    q ? ilike(t.peticoes.assunto, `%${q}%`) : undefined,
  );

  const [rows, totalRows] = await Promise.all([
    db
      .select()
      .from(t.peticoes)
      .where(filters)
      .orderBy(
        parseSort(c) === "asc"
          ? sql`${t.peticoes.dataEntrada} ASC NULLS LAST`
          : sql`${t.peticoes.dataEntrada} DESC NULLS LAST`,
        asc(t.peticoes.id),
      )
      .limit(limit)
      .offset(offset),
    db.select({ total: sql<number>`count(*)::int` }).from(t.peticoes).where(filters),
  ]);

  setCache(c);
  return c.json({ data: rows, total: totalRows[0]?.total ?? 0, page, limit });
});

// GET /peticoes/:id — returns everything by default.
// Pass ?include=A,B to receive only those relations (whitelist), as in /iniciativas/:id.
// Top-level: comissoes, documentos, publicacoes, relacionadas
// Within comissoes (prefix or bare): comissoes.relatores, comissoes.relatorioFinal,
//   comissoes.documentos, comissoes.audicoes, comissoes.pedidosInformacao
const TOP_LEVEL_INCLUDES = ["comissoes", "documentos", "publicacoes", "relacionadas"] as const;
const COMISSAO_INCLUDES = [
  "relatores", "relatorioFinal", "documentos", "audicoes", "pedidosInformacao",
] as const;
// `documentos` exists at both levels, so its bare form always means the top-level
// relation — the committee one must be requested as `comissoes.documentos`.
const BARE_COMISSAO_INCLUDES = COMISSAO_INCLUDES.filter((k) => k !== "documentos");

const VALID_INCLUDES = new Set<string>([
  ...TOP_LEVEL_INCLUDES,
  ...BARE_COMISSAO_INCLUDES,
  ...COMISSAO_INCLUDES.map((k) => `comissoes.${k}`),
]);

app.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (!id) return c.json({ error: "Invalid id" }, 400);

  const includeParam = c.req.query("include");
  // null = no restriction → include everything; Set = whitelist
  const includes: Set<string> | null = includeParam !== undefined
    ? new Set(includeParam.split(",").map((s) => s.trim()).filter(Boolean))
    : null;
  const all = includes === null;

  // Fail loudly on typos rather than silently returning an incomplete object.
  if (includes) {
    const unknown = [...includes].filter((k) => !VALID_INCLUDES.has(k));
    if (unknown.length) {
      return c.json({
        error: `Unknown include key(s): ${unknown.join(", ")}`,
        valid: [...VALID_INCLUDES].sort(),
      }, 400);
    }
  }

  const has = (key: string) => all || includes!.has(key);
  // Comissão sub-relation included? Supports bare key or "comissoes.key" prefix.
  const hasComissao = (sub: string) =>
    all || includes!.has("comissoes") || includes!.has(`comissoes.${sub}`)
    || (sub !== "documentos" && includes!.has(sub));

  const needsComissoes = all || has("comissoes") || COMISSAO_INCLUDES.some(hasComissao);

  const comissaoWith: Record<string, unknown> = {};
  if (hasComissao("relatores"))         comissaoWith.relatores         = true;
  if (hasComissao("relatorioFinal"))    comissaoWith.relatorioFinal    = true;
  if (hasComissao("documentos"))        comissaoWith.documentos        = true;
  if (hasComissao("audicoes"))          comissaoWith.audicoes          = true;
  if (hasComissao("pedidosInformacao")) comissaoWith.pedidosInformacao = true;

  const withClause: Record<string, unknown> = {};
  if (needsComissoes)        withClause.comissoes    = { with: comissaoWith };
  if (has("documentos"))     withClause.documentos   = true;
  if (has("publicacoes"))    withClause.publicacoes  = true;
  if (has("relacionadas"))   withClause.relacionadas = true;

  const pet = await db.query.peticoes.findFirst({
    where: eq(t.peticoes.id, id),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    with: withClause as any,
  });

  if (!pet) return c.json({ error: "Not found" }, 404);

  if (setCacheWithEtag(c, pet.updatedAt)) return c.body(null, 304);
  return c.json(pet);
});

export default app;
