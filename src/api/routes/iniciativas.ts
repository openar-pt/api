import { Hono } from "hono";
import { and, asc, count, desc, eq, gte, ilike, inArray, lte, notInArray, or, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import * as t from "../../db/schema.js";

function weakEtag(d: Date): string {
  return `W/"${d.getTime().toString(36)}"`;
}

const app = new Hono();

function parsePage(c: { req: { query: (k: string) => string | undefined } }) {
  const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(c.req.query("limit") ?? "50", 10) || 50));
  return { page, limit, offset: (page - 1) * limit };
}

// GET /iniciativas?legislatura=XVII&tipo=P&estado=Aprovado&grupo=PS&resultado=aprovado&dataEntradaDe=2023-01-01&dataEntradaAte=2023-12-31&deputado=123&q=habitação&updated_since=2026-05-01T00:00:00Z&page=1&limit=50
app.get("/", async (c) => {
  const { page, limit, offset } = parsePage(c);
  const legislatura = c.req.query("legislatura");
  const tipo = c.req.query("tipo");
  const estados = c.req.queries("estado") ?? (c.req.query("estado") ? [c.req.query("estado")!] : undefined);
  const grupo = c.req.query("grupo");
  const resultado = c.req.query("resultado"); // "aprovado" | "rejeitado" | "pendente"
  const dataEntradaDe = c.req.query("dataEntradaDe");
  const dataEntradaAte = c.req.query("dataEntradaAte");
  const updatedSince = c.req.query("updated_since");
  const deputadoParam = c.req.query("deputado");
  const deputadoId: number | undefined = deputadoParam
    ? (Number.isNaN(parseInt(deputadoParam, 10)) ? undefined : parseInt(deputadoParam, 10))
    : undefined;
  const deputadoNome: string | undefined = deputadoParam && Number.isNaN(parseInt(deputadoParam, 10))
    ? deputadoParam
    : undefined;
  const q = c.req.query("q");

  // Subquery: iniciativas with at least one votação with the given resultado
  let resultadoIniIds: number[] | undefined;
  if (resultado === "aprovado" || resultado === "rejeitado") {
    const label = resultado === "aprovado" ? "Aprovado" : "Rejeitado";
    const rows = await db
      .selectDistinctOn([t.votacoes.iniciativaId], { iniciativaId: t.votacoes.iniciativaId })
      .from(t.votacoes)
      .where(eq(t.votacoes.resultado, label));
    resultadoIniIds = rows.map((r) => r.iniciativaId as number);
    if (resultadoIniIds.length === 0) return c.json({ data: [], total: 0, page, limit });
  }

  // Subquery: iniciativas with no votações at all (pendente)
  let pendenteExcludeIds: number[] | undefined;
  if (resultado === "pendente") {
    const withVotes = await db
      .selectDistinctOn([t.votacoes.iniciativaId], { iniciativaId: t.votacoes.iniciativaId })
      .from(t.votacoes);
    pendenteExcludeIds = withVotes.map((r) => r.iniciativaId as number);
  }

  // Subquery: iniciativas authored by a specific deputado (by ID or name)
  let deputadoIniIds: number[] | undefined;
  if (deputadoId || deputadoNome) {
    let resolvedIds: number[] = deputadoId ? [deputadoId] : [];
    if (deputadoNome) {
      const matches = await db
        .select({ id: t.deputados.id })
        .from(t.deputados)
        .where(ilike(t.deputados.nomeParlamentar, `%${deputadoNome}%`));
      resolvedIds = matches.map((d) => d.id);
      if (resolvedIds.length === 0) return c.json({ data: [], total: 0, page, limit });
    }
    const autores = await db
      .selectDistinctOn([t.autoresIniciativas.iniciativaId], { iniciativaId: t.autoresIniciativas.iniciativaId })
      .from(t.autoresIniciativas)
      .where(inArray(t.autoresIniciativas.deputadoId, resolvedIds));
    deputadoIniIds = autores.map((a) => a.iniciativaId);
    if (deputadoIniIds.length === 0) return c.json({ data: [], total: 0, page, limit });
  }

  // When filtering by grupo, find matching iniciativa IDs first
  let grupoIniIds: number[] | undefined;
  if (grupo) {
    const autores = await db
      .selectDistinctOn([t.autoresIniciativas.iniciativaId], {
        iniciativaId: t.autoresIniciativas.iniciativaId,
      })
      .from(t.autoresIniciativas)
      .where(
        grupo === "Governo"
          ? eq(t.autoresIniciativas.tipo, "governo")
          : eq(t.autoresIniciativas.grupoParlamentar, grupo),
      );
    grupoIniIds = autores.map((a) => a.iniciativaId);
    if (grupoIniIds.length === 0) return c.json({ data: [], total: 0, page, limit });
  }

  const filters = and(
    legislatura ? eq(t.iniciativas.legislaturaId, legislatura) : undefined,
    tipo ? eq(t.iniciativas.tipo, tipo) : undefined,
    estados?.length === 1 ? eq(t.iniciativas.estado, estados[0]) : estados?.length ? inArray(t.iniciativas.estado, estados) : undefined,
    grupoIniIds ? inArray(t.iniciativas.id, grupoIniIds) : undefined,
    resultadoIniIds ? inArray(t.iniciativas.id, resultadoIniIds) : undefined,
    resultado === "pendente" && pendenteExcludeIds?.length ? notInArray(t.iniciativas.id, pendenteExcludeIds) : undefined,
    deputadoIniIds ? inArray(t.iniciativas.id, deputadoIniIds) : undefined,
    dataEntradaDe ? gte(t.iniciativas.dataEntrada, dataEntradaDe) : undefined,
    dataEntradaAte ? lte(t.iniciativas.dataEntrada, dataEntradaAte) : undefined,
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
      .orderBy(c.req.query("sort") === "asc"
        ? sql`${t.iniciativas.dataEntrada} ASC NULLS LAST`
        : sql`${t.iniciativas.dataEntrada} DESC NULLS LAST`)
      .limit(limit)
      .offset(offset),
    db.select({ total: count() }).from(t.iniciativas).where(filters),
  ]);

  return c.json({ data: rows, total, page, limit });
});

// GET /iniciativas/:id — full detail with autores, eventos, votações, relacionadas
app.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (!id) return c.json({ error: "Invalid id" }, 400);

  const ini = await db.query.iniciativas.findFirst({
    where: eq(t.iniciativas.id, id),
    with: {
      autores: true,
      eventos: {
        orderBy: [asc(t.eventos.dataFase)],
        with: {
          votacoes: true,
          publicacoes: true,
          anexos: true,
          iniciativasConjuntas: true,
          peticoesConjuntas: true,
          intervencoesdebates: { with: { oradores: { with: { publicacoes: true } } } },
          comissoesFases: {
            with: {
              relatores: true,
              votacoes: { with: { publicacoes: true } },
              documentos: true,
              audicoes: true,
              remessas: true,
              publicacoes: true,
            },
          },
        },
      },
      relacionadas: true,
      anexos: true,
      conjuntas: true,
      peticoes: true,
      propostasAlteracao: { with: { publicacoes: true } },
    },
  });

  if (!ini) return c.json({ error: "Not found" }, 404);

  const etag = weakEtag(ini.updatedAt);
  c.header("ETag", etag);
  c.header("Cache-Control", "no-cache");
  if (c.req.header("if-none-match") === etag) return c.body(null, 304);

  return c.json(ini);
});

export default app;
