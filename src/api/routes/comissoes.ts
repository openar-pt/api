import { Hono } from "hono";
import { and, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import * as t from "../../db/schema.js";
import { parsePage } from "./utils.js";

const app = new Hono();

// GET /comissoes?legislatura=XVI&q=saude&page=1&limit=50
app.get("/", async (c) => {
  const { page, limit, offset } = parsePage(c);
  const legislatura = c.req.query("legislatura");
  const q = c.req.query("q");

  const filters = and(
    q ? ilike(t.comissoes.nome, `%${q}%`) : undefined,
  );

  // When filtering by legislatura, restrict to committees that appear in that era
  const legislaturaFilter = legislatura
    ? sql`${t.comissoes.id} IN (
        SELECT DISTINCT comissao_id FROM comissoes_fases
        INNER JOIN iniciativas ON comissoes_fases.iniciativa_id = iniciativas.id
        WHERE comissoes_fases.comissao_id IS NOT NULL AND iniciativas.legislatura_id = ${legislatura}
        UNION
        SELECT DISTINCT comissao_id FROM ativ_cms
        WHERE comissao_id IS NOT NULL AND legislatura_id = ${legislatura}
      )`
    : undefined;

  const baseFilter = and(filters, legislaturaFilter);

  const [rows, [{ total }]] = await Promise.all([
    db
      .select({ id: t.comissoes.id, nome: t.comissoes.nome, sigla: t.comissoes.sigla })
      .from(t.comissoes)
      .where(baseFilter)
      .orderBy(t.comissoes.nome)
      .limit(limit)
      .offset(offset),
    db
      .select({ total: sql<number>`count(*)::int` })
      .from(t.comissoes)
      .where(baseFilter),
  ]);

  return c.json({ data: rows, total, page, limit });
});

// GET /comissoes/:id?legislatura=XVI&q=habitação&estado=Aprovado&tipo=P&page=1&limit=50
app.get("/:id", async (c) => {
  const idParam = c.req.param("id");
  const { page, limit, offset } = parsePage(c);
  const legislatura = c.req.query("legislatura");
  const q = c.req.query("q");
  const estado = c.req.query("estado");
  const tipo = c.req.query("tipo");
  const sort = c.req.query("sort") === "asc" ? "asc" : "desc";

  const numericId = parseInt(idParam, 10);
  if (!Number.isInteger(numericId) || numericId <= 0) return c.json({ error: "Invalid id" }, 400);
  const comissao = await db.query.comissoes.findFirst({
    where: eq(t.comissoes.id, numericId),
    columns: { id: true, nome: true, sigla: true },
  });
  if (!comissao) return c.json({ error: "Not found" }, 404);

  const iniFilters = and(
    eq(t.comissoesFases.comissaoId, comissao.id),
    legislatura ? eq(t.iniciativas.legislaturaId, legislatura) : undefined,
    q ? ilike(t.iniciativas.titulo, `%${q}%`) : undefined,
    estado ? eq(t.iniciativas.estado, estado) : undefined,
    tipo ? eq(t.iniciativas.tipo, tipo) : undefined,
  );

  const dedupSub = db
    .selectDistinctOn([t.comissoesFases.iniciativaId], {
      id: t.iniciativas.id,
      legislaturaId: t.iniciativas.legislaturaId,
      numero: t.iniciativas.numero,
      tipo: t.iniciativas.tipo,
      tipoDesc: t.iniciativas.tipoDesc,
      titulo: t.iniciativas.titulo,
      dataEntrada: t.iniciativas.dataEntrada,
      dataFim: t.iniciativas.dataFim,
      estado: t.iniciativas.estado,
    })
    .from(t.comissoesFases)
    .innerJoin(t.iniciativas, eq(t.comissoesFases.iniciativaId, t.iniciativas.id))
    .where(iniFilters)
    .orderBy(t.comissoesFases.iniciativaId, desc(t.iniciativas.dataEntrada))
    .as("sub");

  const [iniciativaRows, [{ total }], legislaturasRows] = await Promise.all([
    db
      .select()
      .from(dedupSub)
      .orderBy(sort === "asc"
        ? sql`${dedupSub.dataEntrada} ASC NULLS LAST`
        : sql`${dedupSub.dataEntrada} DESC NULLS LAST`)
      .limit(limit)
      .offset(offset),
    db
      .select({ total: sql<number>`count(distinct ${t.comissoesFases.iniciativaId})::int` })
      .from(t.comissoesFases)
      .innerJoin(t.iniciativas, eq(t.comissoesFases.iniciativaId, t.iniciativas.id))
      .where(iniFilters),
    // Legislaturas where this committee is active — from both iniciativas and deputy membership
    db.execute(sql`
      SELECT leg.id AS legislatura_id, leg.data_inicio
      FROM legislaturas leg
      WHERE leg.id IN (
        SELECT DISTINCT i.legislatura_id
        FROM comissoes_fases cf
        INNER JOIN iniciativas i ON cf.iniciativa_id = i.id
        WHERE cf.comissao_id = ${comissao.id}
        UNION
        SELECT DISTINCT legislatura_id
        FROM ativ_cms
        WHERE comissao_id = ${comissao.id}
      )
      ORDER BY leg.data_inicio DESC
    `),
  ]);

  const iniIds = iniciativaRows.map((r) => r.id);
  const fases = iniIds.length
    ? await db.query.comissoesFases.findMany({
        where: and(
          eq(t.comissoesFases.comissaoId, comissao.id),
          inArray(t.comissoesFases.iniciativaId, iniIds),
        ),
        with: {
          relatores: true,
          votacoes: { with: { publicacoes: true } },
          documentos: true,
          audicoes: true,
          remessas: true,
          publicacoes: true,
        },
      })
    : [];

  const fasesByIni = new Map<number, typeof fases>();
  for (const fase of fases) {
    const list = fasesByIni.get(fase.iniciativaId) ?? [];
    list.push(fase);
    fasesByIni.set(fase.iniciativaId, list);
  }

  const data = iniciativaRows.map((ini) => ({
    ...ini,
    comissoesFases: fasesByIni.get(ini.id) ?? [],
  }));

  const legislaturas = (legislaturasRows.rows as { legislatura_id: string }[])
    .map((r) => r.legislatura_id)
    .filter(Boolean);

  return c.json({ id: comissao.id, nome: comissao.nome, sigla: comissao.sigla, legislaturas, total, page, limit, data });
});

export default app;
