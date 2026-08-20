import { Hono } from "hono";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import * as t from "../../db/schema.js";
import { parsePage, parseSort, setCache } from "./utils.js";

const app = new Hono();

// GET /deputados/:id/intervencoes?legislatura=XVII&sort=desc&page=1&limit=50
//
// One row per speech the deputy made in a plenary debate on an iniciativa.
//
// This is a different source from /deputados/:id/atividade → intervencoes:
// atividade carries the deputy's own logged interventions (sparse — most
// deputies have 0–1 per legislature), while these come from the Iniciativas
// feed's IniEventos[].Intervencoesdebates[].Oradores[]. The two overlap only
// partially, so consumers wanting full coverage should merge both.
//
// Join path is indexed end to end via idx_orador_deputados_deputado.
app.get("/:id/intervencoes", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (!id) return c.json({ error: "Invalid id" }, 400);

  const { page, limit, offset } = parsePage(c);
  const legislatura = c.req.query("legislatura");
  const sort = parseSort(c); // date-ordered → newest first by default

  const filters = and(
    eq(t.oradorDeputados.deputadoId, id),
    legislatura ? eq(t.iniciativas.legislaturaId, legislatura) : undefined,
  );

  const [rows, totalRows] = await Promise.all([
    db
      .select({
        oradorId: t.oradores.id,
        intervencaoId: t.intervencoesdebates.id,
        dataReuniao: t.intervencoesdebates.dataReuniao,
        faseDebate: t.oradores.faseDebate,
        faseSessao: t.oradores.faseSessao,
        horaInicio: t.oradores.horaInicio,
        horaTermo: t.oradores.horaTermo,
        sumario: t.oradores.sumario,
        linkVideos: t.oradores.linkVideos,
        gp: t.oradorDeputados.gp,
        nome: t.oradorDeputados.nome,
        eventoId: t.eventos.id,
        fase: t.eventos.fase,
        iniciativaId: t.iniciativas.id,
        iniciativaNumero: t.iniciativas.numero,
        iniciativaTipo: t.iniciativas.tipo,
        iniciativaTitulo: t.iniciativas.titulo,
        legislaturaId: t.iniciativas.legislaturaId,
      })
      .from(t.oradorDeputados)
      .innerJoin(t.oradores, eq(t.oradorDeputados.oradorId, t.oradores.id))
      .innerJoin(t.intervencoesdebates, eq(t.oradores.intervencaoId, t.intervencoesdebates.id))
      .innerJoin(t.eventos, eq(t.intervencoesdebates.eventoId, t.eventos.id))
      .innerJoin(t.iniciativas, eq(t.intervencoesdebates.iniciativaId, t.iniciativas.id))
      .where(filters)
      // NULLS LAST has to sit inside the fragment: wrapping it in drizzle's
      // asc()/desc() emits "… NULLS LAST desc", which Postgres rejects.
      .orderBy(
        sort === "asc"
          ? sql`${t.intervencoesdebates.dataReuniao} asc nulls last`
          : sql`${t.intervencoesdebates.dataReuniao} desc nulls last`,
        asc(t.oradores.horaInicio),
        asc(t.oradores.id),
      )
      .limit(limit)
      .offset(offset),

    db
      .select({ total: sql<number>`count(*)::int` })
      .from(t.oradorDeputados)
      .innerJoin(t.oradores, eq(t.oradorDeputados.oradorId, t.oradores.id))
      .innerJoin(t.intervencoesdebates, eq(t.oradores.intervencaoId, t.intervencoesdebates.id))
      .innerJoin(t.iniciativas, eq(t.intervencoesdebates.iniciativaId, t.iniciativas.id))
      .where(filters),
  ]);

  // DAR refs are a separate table; fetch them for just this page of speeches
  const oradorIds = rows.map((r) => r.oradorId);
  const pubs = oradorIds.length
    ? await db
        .select({
          oradorId: t.oradorPublicacoes.oradorId,
          data: t.oradorPublicacoes.data,
          legislatura: t.oradorPublicacoes.legislatura,
          numero: t.oradorPublicacoes.numero,
          sessaoLegislativa: t.oradorPublicacoes.sessaoLegislativa,
          tipo: t.oradorPublicacoes.tipo,
          paginas: t.oradorPublicacoes.paginas,
          urlDiario: t.oradorPublicacoes.urlDiario,
        })
        .from(t.oradorPublicacoes)
        .where(inArray(t.oradorPublicacoes.oradorId, oradorIds))
    : [];

  const pubsByOrador = new Map<number, typeof pubs>();
  for (const p of pubs) {
    const list = pubsByOrador.get(p.oradorId);
    if (list) list.push(p);
    else pubsByOrador.set(p.oradorId, [p]);
  }

  const data = rows.map(({ iniciativaId, iniciativaNumero, iniciativaTipo, iniciativaTitulo, ...r }) => ({
    ...r,
    iniciativa: {
      id: iniciativaId,
      numero: iniciativaNumero,
      tipo: iniciativaTipo,
      titulo: iniciativaTitulo,
    },
    publicacoes: pubsByOrador.get(r.oradorId) ?? [],
  }));

  setCache(c);
  return c.json({ data, total: totalRows[0]?.total ?? 0, page, limit });
});

export default app;
