import { Hono } from "hono";
import { and, asc, count, eq, gte, lte, sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { db } from "../../db/index.js";
import * as t from "../../db/schema.js";
import { parseBool, parseDateRange, parsePage, parseSort, setCache } from "./utils.js";

const app = new Hono();

const OUTRO_AUTORES: Record<string, string> = {
  PAR: "PAR",
  Madeira: "Assembleia Legislativa da Região Autónoma da Madeira",
  Açores: "Assembleia Legislativa da Região Autónoma dos Açores",
  Mesa: "Mesa da Assembleia",
};

// GET /votacoes?legislatura=XVII&resultado=Aprovado&unanime=true&tipo=J&iniciativa=123&grupo=PS&a_favor=PS&contra=CH&data_inicio=2025-01-01&data_fim=2025-12-31
app.get("/", async (c) => {
  const { page, limit, offset } = parsePage(c);
  const legislatura = c.req.query("legislatura");
  const resultado = c.req.query("resultado");
  const tipo = c.req.query("tipo");
  const unanime = parseBool(c, "unanime");
  const { from: dataInicio, to: dataFim } = parseDateRange(c);
  const grupo = c.req.query("grupo");

  const iniciativaParam = c.req.query("iniciativa");
  if (iniciativaParam !== undefined && !/^\d+$/.test(iniciativaParam)) {
    return c.json({ error: "'iniciativa' must be a numeric id" }, 400);
  }
  const iniciativaId = iniciativaParam ? parseInt(iniciativaParam, 10) : undefined;

  // Filter by how a group voted — mirrors the aFavor/contra/abstencao response fields.
  const sentidoFilter = (col: AnyPgColumn, param: string) => {
    const sigla = c.req.query(param);
    return sigla ? sql`${col} @> ARRAY[${sigla}]::text[]` : undefined;
  };

  // Votações of iniciativas authored by `grupo` — same semantics as /iniciativas?grupo=
  const grupoFilter = grupo
    ? grupo === "Governo"
      ? sql`EXISTS (SELECT 1 FROM autores_iniciativas a WHERE a.iniciativa_id = ${t.votacoes.iniciativaId} AND a.tipo = 'governo')`
      : OUTRO_AUTORES[grupo]
        ? sql`EXISTS (SELECT 1 FROM autores_iniciativas a WHERE a.iniciativa_id = ${t.votacoes.iniciativaId} AND a.tipo = 'outro' AND a.nome = ${OUTRO_AUTORES[grupo]})`
        : sql`EXISTS (SELECT 1 FROM autores_iniciativas a WHERE a.iniciativa_id = ${t.votacoes.iniciativaId} AND a.grupo_parlamentar = ${grupo})`
    : undefined;

  const filters = and(
    legislatura ? eq(t.iniciativas.legislaturaId, legislatura) : undefined,
    resultado ? eq(t.votacoes.resultado, resultado) : undefined,
    tipo ? eq(t.iniciativas.tipo, tipo) : undefined,
    iniciativaId !== undefined ? eq(t.votacoes.iniciativaId, iniciativaId) : undefined,
    unanime !== undefined ? eq(t.votacoes.unanime, unanime) : undefined,
    grupoFilter,
    sentidoFilter(t.votacoes.aFavor, "a_favor"),
    sentidoFilter(t.votacoes.contra, "contra"),
    sentidoFilter(t.votacoes.abstencao, "abstencao"),
    dataInicio ? gte(t.votacoes.data, dataInicio) : undefined,
    dataFim ? lte(t.votacoes.data, dataFim) : undefined,
  );

  const base = db
    .select({
      id: t.votacoes.id,
      iniciativaId: t.votacoes.iniciativaId,
      iniciativaTitulo: t.iniciativas.titulo,
      iniciativaNumero: t.iniciativas.numero,
      iniciativaTipo: t.iniciativas.tipo,
      legislaturaId: t.iniciativas.legislaturaId,
      data: t.votacoes.data,
      resultado: t.votacoes.resultado,
      unanime: t.votacoes.unanime,
      reuniao: t.votacoes.reuniao,
      tipoReuniao: t.votacoes.tipoReuniao,
      descricao: t.votacoes.descricao,
      aFavor: t.votacoes.aFavor,
      contra: t.votacoes.contra,
      abstencao: t.votacoes.abstencao,
      ausencias: t.votacoes.ausencias,
      detalhe: t.votacoes.detalhe,
    })
    .from(t.votacoes)
    .innerJoin(t.iniciativas, eq(t.votacoes.iniciativaId, t.iniciativas.id))
    .where(filters);

  const [rows, [{ total }]] = await Promise.all([
    base
      .orderBy(
        parseSort(c) === "asc"
          ? sql`${t.votacoes.data} ASC NULLS LAST`
          : sql`${t.votacoes.data} DESC NULLS LAST`,
        asc(t.votacoes.id),
      )
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(t.votacoes)
      .innerJoin(t.iniciativas, eq(t.votacoes.iniciativaId, t.iniciativas.id))
      .where(filters),
  ]);

  setCache(c);
  return c.json({ data: rows, total, page, limit });
});

// GET /votacoes/:id?iniciativa_id=<n>
// iniciativa_id is required for unambiguous lookup since votacao ids are only
// unique within an iniciativa (composite PK).
app.get("/:id", async (c) => {
  const id = c.req.param("id");
  const iniciativaIdParam = c.req.query("iniciativa_id");
  const iniciativaId = iniciativaIdParam ? parseInt(iniciativaIdParam, 10) : NaN;

  if (!iniciativaIdParam || isNaN(iniciativaId)) {
    return c.json({ error: "iniciativa_id query parameter is required" }, 400);
  }

  const vot = await db.query.votacoes.findFirst({
    where: and(eq(t.votacoes.id, id), eq(t.votacoes.iniciativaId, iniciativaId)),
    with: { publicacoes: true },
  });
  if (!vot) return c.json({ error: "Not found" }, 404);

  const ini = await db.query.iniciativas.findFirst({
    where: eq(t.iniciativas.id, vot.iniciativaId),
    columns: { id: true, titulo: true, numero: true, tipo: true, legislaturaId: true },
  });

  setCache(c);
  return c.json({ ...vot, iniciativa: ini });
});

export default app;
