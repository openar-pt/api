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

// GET /peticoes/:id
app.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (!id) return c.json({ error: "Invalid id" }, 400);

  const [pet, comissoes, documentos] = await Promise.all([
    db.query.peticoes.findFirst({ where: eq(t.peticoes.id, id) }),
    db.query.peticaoComissoes.findMany({
      where: eq(t.peticaoComissoes.peticaoId, id),
      with: { relatores: true },
    }),
    db.select().from(t.peticaoDocumentos).where(eq(t.peticaoDocumentos.peticaoId, id)),
  ]);

  if (!pet) return c.json({ error: "Not found" }, 404);

  if (setCacheWithEtag(c, pet.updatedAt)) return c.body(null, 304);
  return c.json({ ...pet, comissoes, documentos });
});

export default app;
