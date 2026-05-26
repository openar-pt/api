import { Hono } from "hono";
import { and, asc, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import * as t from "../../db/schema.js";
import { parsePage } from "./utils.js";

const app = new Hono();

// GET /deputados?legislatura=XVII&grupo=PS&situacao=Efetivo&q=António&page=1&limit=50
app.get("/", async (c) => {
  const { page, limit, offset } = parsePage(c);
  const legislatura = c.req.query("legislatura");
  const grupo = c.req.query("grupo");
  const situacao = c.req.query("situacao"); // "Efetivo" | "Suplente" | "Impedido" | "ativo" (Efetivo + Efetivo Temporário + Impedido)
  const q = c.req.query("q");

  // "ativo" = currently seated: Efetivo + Efetivo Temporário + Efetivo Definitivo (= 230 seats)
  // Impedido are deputies serving in government — their suplente holds the seat instead
  const situacaoFilter = situacao === "ativo"
    ? inArray(t.mandatos.situacao, ["Efetivo", "Efetivo Temporário", "Efetivo Definitivo"])
    : situacao ? eq(t.mandatos.situacao, situacao) : undefined;

  const filters = and(
    legislatura ? eq(t.mandatos.legislaturaId, legislatura) : undefined,
    grupo ? eq(t.mandatos.grupoParlamentar, grupo) : undefined,
    situacaoFilter,
    q ? ilike(t.deputados.nomeParlamentar, `%${q}%`) : undefined,
  );

  // Use a subquery so we can ORDER BY name on the outer query without
  // conflicting with DISTINCT ON's requirement that its column leads ORDER BY
  const sub = db
    .selectDistinctOn([t.deputados.id], {
      id: t.deputados.id,
      nomeParlamentar: t.deputados.nomeParlamentar,
      nomeCompleto: t.deputados.nomeCompleto,
      grupoParlamentar: t.mandatos.grupoParlamentar,
      circuloEleitoral: t.mandatos.circuloEleitoral,
      legislaturaId: t.mandatos.legislaturaId,
      situacao: t.mandatos.situacao,
    })
    .from(t.deputados)
    .innerJoin(t.mandatos, eq(t.deputados.id, t.mandatos.deputadoId))
    .innerJoin(t.legislaturas, eq(t.mandatos.legislaturaId, t.legislaturas.id))
    .where(filters)
    .orderBy(t.deputados.id, desc(t.legislaturas.dataInicio))
    .as("sub");

  const [rows, totalRows] = await Promise.all([
    db.select().from(sub).orderBy(asc(sub.nomeParlamentar)).limit(limit).offset(offset),
    db.select({ total: sql<number>`count(*)::int` }).from(sub),
  ]);

  const total = totalRows[0]?.total ?? 0;

  return c.json({ data: rows, total, page, limit });
});

// GET /deputados/:id
app.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (!id) return c.json({ error: "Invalid id" }, 400);

  const [dep, stats, iniciativas, bioHab, bioTit, bioCar, bioCond, bioObras] = await Promise.all([
    db.query.deputados.findFirst({
      where: eq(t.deputados.id, id),
      with: { mandatos: true, cargos: true, situacoes: true },
    }),

    // Aggregate stats across all authored iniciativas
    db.execute(sql`
      SELECT
        count(*)::int AS total,
        count(*) filter (
          where i.estado ilike '%lei%'
          or i.estado ilike '%aprovad%'
          or i.estado ilike '%publicad%'
          or i.estado ilike '%resolução da ar%'
        )::int AS aprovadas,
        (
          SELECT json_object_agg(tipo_desc, cnt)
          FROM (
            SELECT i2.tipo_desc, count(*)::int AS cnt
            FROM autores_iniciativas a2
            JOIN iniciativas i2 ON i2.id = a2.iniciativa_id
            WHERE a2.deputado_id = ${id} AND i2.tipo_desc IS NOT NULL
            GROUP BY i2.tipo_desc
          ) t
        ) AS por_tipo
      FROM autores_iniciativas a
      JOIN iniciativas i ON i.id = a.iniciativa_id
      WHERE a.deputado_id = ${id}
    `).then(r => r.rows[0] ?? { total: 0, aprovadas: 0, por_tipo: {} }),

    // Most recent iniciativas
    db
      .select({
        id:          t.iniciativas.id,
        legislaturaId: t.iniciativas.legislaturaId,
        numero:      t.iniciativas.numero,
        tipo:        t.iniciativas.tipo,
        tipoDesc:    t.iniciativas.tipoDesc,
        titulo:      t.iniciativas.titulo,
        dataEntrada: t.iniciativas.dataEntrada,
        estado:      t.iniciativas.estado,
      })
      .from(t.autoresIniciativas)
      .innerJoin(t.iniciativas, eq(t.autoresIniciativas.iniciativaId, t.iniciativas.id))
      .where(eq(t.autoresIniciativas.deputadoId, id))
      .orderBy(sql`${t.iniciativas.dataEntrada} desc nulls last`)
      .limit(20),

    db.select().from(t.bioHabilitacoes).where(eq(t.bioHabilitacoes.deputadoId, id)),
    db.select().from(t.bioTitulos).where(eq(t.bioTitulos.deputadoId, id)).orderBy(t.bioTitulos.ordem),
    db.select().from(t.bioCargosFuncoes).where(eq(t.bioCargosFuncoes.deputadoId, id)).orderBy(t.bioCargosFuncoes.ordem),
    db.select().from(t.bioCondecoracoes).where(eq(t.bioCondecoracoes.deputadoId, id)).orderBy(t.bioCondecoracoes.ordem),
    db.select().from(t.bioObrasPublicadas).where(eq(t.bioObrasPublicadas.deputadoId, id)).orderBy(t.bioObrasPublicadas.ordem),
  ]);

  if (!dep) return c.json({ error: "Not found" }, 404);

  return c.json({
    ...dep,
    stats,
    iniciativas,
    bio: {
      habilitacoes: bioHab,
      titulos: bioTit,
      cargosFuncoes: bioCar,
      condecoracoes: bioCond,
      obrasPublicadas: bioObras,
    },
  });
});

export default app;
