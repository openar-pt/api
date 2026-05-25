import { Hono } from "hono";
import { and, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import * as t from "../../db/schema.js";

const app = new Hono();

function parsePage(c: { req: { query: (k: string) => string | undefined } }) {
  const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(c.req.query("limit") ?? "50", 10) || 50));
  return { page, limit, offset: (page - 1) * limit };
}

// GET /comissoes?legislatura=XVI&q=saude&page=1&limit=50
app.get("/", async (c) => {
  const { page, limit, offset } = parsePage(c);
  const legislatura = c.req.query("legislatura");
  const q = c.req.query("q");

  const normalizedNome = sql`lower(trim(${t.comissoesFases.nome}))`;

  const filters = and(
    legislatura ? eq(t.iniciativas.legislaturaId, legislatura) : undefined,
    q ? ilike(t.comissoesFases.nome, `%${q}%`) : undefined,
  );

  const [rows, [{ total }]] = await Promise.all([
    db
      .selectDistinctOn([normalizedNome], {
        numero: t.comissoesFases.numero,
        sigla: t.comissoesFases.sigla,
        nome: sql<string>`trim(${t.comissoesFases.nome})`,
      })
      .from(t.comissoesFases)
      .innerJoin(t.iniciativas, eq(t.comissoesFases.iniciativaId, t.iniciativas.id))
      .where(filters)
      .orderBy(normalizedNome)
      .limit(limit)
      .offset(offset),
    db
      .select({ total: sql<number>`count(distinct lower(trim(${t.comissoesFases.nome})))::int` })
      .from(t.comissoesFases)
      .innerJoin(t.iniciativas, eq(t.comissoesFases.iniciativaId, t.iniciativas.id))
      .where(filters),
  ]);

  return c.json({ data: rows, total, page, limit });
});

// GET /comissoes/:numero?legislatura=XVI&page=1&limit=50
app.get("/:numero", async (c) => {
  const numero = c.req.param("numero");
  const { page, limit, offset } = parsePage(c);
  const legislatura = c.req.query("legislatura");

  const comissao = await db.query.comissoesFases.findFirst({
    where: eq(t.comissoesFases.numero, numero),
    columns: { numero: true, sigla: true, nome: true },
  });
  if (!comissao) return c.json({ error: "Not found" }, 404);

  const iniFilters = and(
    eq(t.comissoesFases.numero, numero),
    legislatura ? eq(t.iniciativas.legislaturaId, legislatura) : undefined,
  );

  const [iniciativaRows, [{ total }]] = await Promise.all([
    db
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
      .limit(limit)
      .offset(offset),
    db
      .select({ total: sql<number>`count(distinct ${t.comissoesFases.iniciativaId})::int` })
      .from(t.comissoesFases)
      .innerJoin(t.iniciativas, eq(t.comissoesFases.iniciativaId, t.iniciativas.id))
      .where(iniFilters),
  ]);

  const iniIds = iniciativaRows.map((r) => r.id);
  const relatores = iniIds.length
    ? await db
        .select({
          iniciativaId: t.comissaoRelatores.iniciativaId,
          deputadoId: t.comissaoRelatores.deputadoId,
          nome: t.comissaoRelatores.nome,
          grupoParlamentar: t.comissaoRelatores.grupoParlamentar,
          dataNomeacao: t.comissaoRelatores.dataNomeacao,
          dataCessacao: t.comissaoRelatores.dataCessacao,
        })
        .from(t.comissaoRelatores)
        .innerJoin(t.comissoesFases, eq(t.comissaoRelatores.comissaoFaseId, t.comissoesFases.id))
        .where(
          and(
            eq(t.comissoesFases.numero, numero),
            inArray(t.comissaoRelatores.iniciativaId, iniIds),
          ),
        )
    : [];

  const relatoresByIni = new Map<number, typeof relatores>();
  for (const rel of relatores) {
    const list = relatoresByIni.get(rel.iniciativaId!) ?? [];
    list.push(rel);
    relatoresByIni.set(rel.iniciativaId!, list);
  }

  const data = iniciativaRows.map((ini) => ({
    ...ini,
    relatores: relatoresByIni.get(ini.id) ?? [],
  }));

  return c.json({ ...comissao, total, page, limit, data });
});

export default app;
