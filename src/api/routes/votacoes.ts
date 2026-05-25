import { Hono } from "hono";
import { and, asc, count, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "../../db/index.js";
import * as t from "../../db/schema.js";

const app = new Hono();

function parsePage(c: { req: { query: (k: string) => string | undefined } }) {
  const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(c.req.query("limit") ?? "50", 10) || 50));
  return { page, limit, offset: (page - 1) * limit };
}

// GET /votacoes?legislatura=XVII&resultado=Aprovado&unanime=true&data_inicio=2025-01-01&data_fim=2025-12-31
app.get("/", async (c) => {
  const { page, limit, offset } = parsePage(c);
  const legislatura = c.req.query("legislatura");
  const resultado = c.req.query("resultado");
  const unanimeParam = c.req.query("unanime");
  const dataInicio = c.req.query("data_inicio");
  const dataFim = c.req.query("data_fim");

  const filters = and(
    legislatura ? eq(t.iniciativas.legislaturaId, legislatura) : undefined,
    resultado ? eq(t.votacoes.resultado, resultado) : undefined,
    unanimeParam !== undefined ? eq(t.votacoes.unanime, unanimeParam === "true") : undefined,
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
      .orderBy(desc(t.votacoes.data), asc(t.votacoes.id))
      .limit(limit)
      .offset(offset),
    db
      .select({ total: count() })
      .from(t.votacoes)
      .innerJoin(t.iniciativas, eq(t.votacoes.iniciativaId, t.iniciativas.id))
      .where(filters),
  ]);

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

  return c.json({ ...vot, iniciativa: ini });
});

export default app;
