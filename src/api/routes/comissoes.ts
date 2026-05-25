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

  // Resolve all numero values that share the same normalized name so that
  // legislatura filtering works across legislature eras (the same committee
  // gets a different numero in each era).
  const sameNome = await db
    .selectDistinct({ numero: t.comissoesFases.numero })
    .from(t.comissoesFases)
    .where(
      sql`lower(trim(${t.comissoesFases.nome})) = lower(trim(${comissao.nome}))`,
    );
  const numeros = sameNome.map((r) => r.numero).filter(Boolean) as string[];

  const iniFilters = and(
    inArray(t.comissoesFases.numero, numeros),
    legislatura ? eq(t.iniciativas.legislaturaId, legislatura) : undefined,
  );

  const [iniciativaRows, [{ total }], legislaturasRows] = await Promise.all([
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
    db
      .selectDistinct({ legislaturaId: t.iniciativas.legislaturaId })
      .from(t.comissoesFases)
      .innerJoin(t.iniciativas, eq(t.comissoesFases.iniciativaId, t.iniciativas.id))
      .innerJoin(t.legislaturas, eq(t.iniciativas.legislaturaId, t.legislaturas.id))
      .where(inArray(t.comissoesFases.numero, numeros))
      .orderBy(desc(t.legislaturas.dataInicio)),
  ]);

  const iniIds = iniciativaRows.map((r) => r.id);
  const fases = iniIds.length
    ? await db.query.comissoesFases.findMany({
        where: and(
          inArray(t.comissoesFases.numero, numeros),
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

  const legislaturas = legislaturasRows.map((r) => r.legislaturaId);

  return c.json({ ...comissao, legislaturas, total, page, limit, data });
});

export default app;
