import { Hono } from "hono";
import { and, asc, count, desc, eq, gte, ilike, inArray, lte, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import * as t from "../../db/schema.js";
import { parseDateRange, parsePage, parseSort, setCache, setCacheWithEtag } from "./utils.js";

const OUTRO_AUTORES: Record<string, string> = {
  PAR: "PAR",
  Madeira: "Assembleia Legislativa da Região Autónoma da Madeira",
  Açores: "Assembleia Legislativa da Região Autónoma dos Açores",
  Mesa: "Mesa da Assembleia",
};

const app = new Hono();

// GET /iniciativas?legislatura=XVII&tipo=P&estado=Aprovado&grupo=PS&resultado=aprovado&data_inicio=2023-01-01&data_fim=2023-12-31&deputado=123&q=habitação&updated_since=2026-05-01T00:00:00Z&page=1&limit=50
app.get("/", async (c) => {
  const { page, limit, offset } = parsePage(c);
  const legislatura = c.req.query("legislatura");
  const tipo = c.req.query("tipo");
  const estados = c.req.queries("estado") ?? (c.req.query("estado") ? [c.req.query("estado")!] : undefined);
  const grupo = c.req.query("grupo");
  const resultado = c.req.query("resultado"); // "aprovado" | "rejeitado" | "pendente"
  const { from: dataDe, to: dataAte } = parseDateRange(c, ["dataEntradaDe", "dataEntradaAte"]);
  const updatedSince = c.req.query("updated_since");
  const deputadoParam = c.req.query("deputado");
  const deputadoId = deputadoParam && /^\d+$/.test(deputadoParam) ? parseInt(deputadoParam, 10) : undefined;
  const deputadoNome = deputadoParam && deputadoId === undefined ? deputadoParam : undefined;
  const q = c.req.query("q");

  // Correlated EXISTS rather than materialising ID lists: keeps the whole filter
  // in one query and stays flat as the corpus grows.
  const resultadoFilter =
    resultado === "aprovado" || resultado === "rejeitado"
      ? sql`EXISTS (SELECT 1 FROM votacoes v WHERE v.iniciativa_id = ${t.iniciativas.id} AND v.resultado = ${resultado === "aprovado" ? "Aprovado" : "Rejeitado"})`
      : resultado === "pendente"
        ? sql`NOT EXISTS (SELECT 1 FROM votacoes v WHERE v.iniciativa_id = ${t.iniciativas.id})`
        : undefined;

  const deputadoFilter = deputadoId !== undefined
    ? sql`EXISTS (SELECT 1 FROM autores_iniciativas a WHERE a.iniciativa_id = ${t.iniciativas.id} AND a.deputado_id = ${deputadoId})`
    : deputadoNome
      ? sql`EXISTS (
          SELECT 1 FROM autores_iniciativas a
          JOIN deputados d ON d.id = a.deputado_id
          WHERE a.iniciativa_id = ${t.iniciativas.id} AND d.nome_parlamentar ILIKE ${`%${deputadoNome}%`}
        )`
      : undefined;

  // `grupo` accepts a party sigla, plus the synthetic authors surfaced by /meta:
  // Governo, PAR, Madeira, Açores, Mesa.
  const grupoFilter = grupo
    ? grupo === "Governo"
      ? sql`EXISTS (SELECT 1 FROM autores_iniciativas a WHERE a.iniciativa_id = ${t.iniciativas.id} AND a.tipo = 'governo')`
      : OUTRO_AUTORES[grupo]
        ? sql`EXISTS (SELECT 1 FROM autores_iniciativas a WHERE a.iniciativa_id = ${t.iniciativas.id} AND a.tipo = 'outro' AND a.nome = ${OUTRO_AUTORES[grupo]})`
        : sql`EXISTS (SELECT 1 FROM autores_iniciativas a WHERE a.iniciativa_id = ${t.iniciativas.id} AND a.grupo_parlamentar = ${grupo})`
    : undefined;

  const filters = and(
    legislatura ? eq(t.iniciativas.legislaturaId, legislatura) : undefined,
    tipo ? eq(t.iniciativas.tipo, tipo) : undefined,
    estados?.length === 1 ? eq(t.iniciativas.estado, estados[0]) : estados?.length ? inArray(t.iniciativas.estado, estados) : undefined,
    grupoFilter,
    resultadoFilter,
    deputadoFilter,
    dataDe ? gte(t.iniciativas.dataEntrada, dataDe) : undefined,
    dataAte ? lte(t.iniciativas.dataEntrada, dataAte) : undefined,
    updatedSince ? gte(t.iniciativas.updatedAt, new Date(updatedSince)) : undefined,
    q ? ilike(t.iniciativas.titulo, `%${q}%`) : undefined,
  );

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: t.iniciativas.id,
        legislaturaId: t.iniciativas.legislaturaId,
        numero: t.iniciativas.numero,
        tipo: t.iniciativas.tipo,
        tipoDesc: t.iniciativas.tipoDesc,
        titulo: t.iniciativas.titulo,
        epigrafe: t.iniciativas.epigrafe,
        dataEntrada: t.iniciativas.dataEntrada,
        dataFim: t.iniciativas.dataFim,
        estado: t.iniciativas.estado,
        linkTexto: t.iniciativas.linkTexto,
        updatedAt: t.iniciativas.updatedAt,
      })
      .from(t.iniciativas)
      .where(filters)
      .orderBy(
        parseSort(c) === "asc"
          ? sql`${t.iniciativas.dataEntrada} ASC NULLS LAST`
          : sql`${t.iniciativas.dataEntrada} DESC NULLS LAST`,
        parseSort(c) === "asc" ? asc(t.iniciativas.id) : desc(t.iniciativas.id),
      )
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(t.iniciativas).where(filters),
  ]);

  setCache(c);
  return c.json({ data: rows, total, page, limit });
});

// GET /iniciativas/:id — returns everything by default.
// Pass ?include=A,B to receive only those relations (whitelist).
// Top-level: autores, eventos, relacionadas, anexos, conjuntas, peticoes, propostasAlteracao
// Within eventos (prefix or bare): eventos.votacoes, eventos.publicacoes,
//   eventos.comissoesFases, eventos.intervencoesdebates, eventos.iniciativasConjuntas,
//   eventos.peticoesConjuntas, eventos.anexos
const TOP_LEVEL_INCLUDES = [
  "autores", "eventos", "relacionadas", "anexos", "conjuntas", "peticoes", "propostasAlteracao",
] as const;
const EVENTO_INCLUDES = [
  "votacoes", "publicacoes", "comissoesFases", "intervencoesdebates",
  "iniciativasConjuntas", "peticoesConjuntas", "anexos",
] as const;
// `anexos` exists at both levels, so its bare form always means the top-level
// relation — the evento one must be requested as `eventos.anexos`.
const BARE_EVENTO_INCLUDES = EVENTO_INCLUDES.filter((k) => k !== "anexos");

const VALID_INCLUDES = new Set<string>([
  ...TOP_LEVEL_INCLUDES,
  ...BARE_EVENTO_INCLUDES,
  ...EVENTO_INCLUDES.map((k) => `eventos.${k}`),
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

  // Top-level relation included?
  const has = (key: string) => all || includes!.has(key);
  // Evento sub-relation included? Supports bare key or "eventos.key" prefix.
  const hasEvento = (sub: string) =>
    all || includes!.has("eventos") || includes!.has(`eventos.${sub}`)
    || (sub !== "anexos" && includes!.has(sub));

  const needsEventos = all || has("eventos") || EVENTO_INCLUDES.some(hasEvento);

  const eventoWith: Record<string, unknown> = {};
  if (hasEvento("votacoes"))             eventoWith.votacoes             = true;
  if (hasEvento("publicacoes"))          eventoWith.publicacoes          = true;
  if (hasEvento("iniciativasConjuntas")) eventoWith.iniciativasConjuntas = true;
  if (hasEvento("peticoesConjuntas"))    eventoWith.peticoesConjuntas    = true;
  if (hasEvento("anexos"))               eventoWith.anexos               = true;
  if (hasEvento("comissoesFases")) {
    eventoWith.comissoesFases = {
      with: {
        relatores: true,
        votacoes: { with: { publicacoes: true } },
        documentos: true,
        audicoes: true,
        remessas: true,
        publicacoes: true,
      },
    };
  }
  if (hasEvento("intervencoesdebates")) {
    eventoWith.intervencoesdebates = { with: { oradores: { with: { publicacoes: true } } } };
  }

  const withClause: Record<string, unknown> = {};
  if (has("autores"))    withClause.autores    = true;
  if (has("relacionadas")) withClause.relacionadas = true;
  if (has("anexos"))     withClause.anexos     = true;
  if (has("conjuntas"))  withClause.conjuntas  = true;
  if (has("peticoes"))   withClause.peticoes   = true;
  if (has("propostasAlteracao")) withClause.propostasAlteracao = { with: { publicacoes: true } };
  if (needsEventos) withClause.eventos = { orderBy: [asc(t.eventos.dataFase)], with: eventoWith };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ini = await db.query.iniciativas.findFirst({ where: eq(t.iniciativas.id, id), with: withClause as any });

  if (!ini) return c.json({ error: "Not found" }, 404);

  if (setCacheWithEtag(c, ini.updatedAt)) return c.body(null, 304);
  return c.json(ini);
});

export default app;
