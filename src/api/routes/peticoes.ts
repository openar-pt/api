import { Hono } from "hono";
import { and, asc, desc, eq, gte, ilike, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import * as t from "../../db/schema.js";
import { parsePage, weakEtag } from "./utils.js";

const app = new Hono();

// GET /peticoes?legislatura=XVII&situacao=...&q=...&updated_since=2026-05-01T00:00:00Z&page=1&limit=50
app.get("/", async (c) => {
  const { page, limit, offset } = parsePage(c);
  const legislatura = c.req.query("legislatura");
  const situacao = c.req.query("situacao");
  const updatedSince = c.req.query("updated_since");
  const q = c.req.query("q");

  const filters = and(
    legislatura ? eq(t.peticoes.legislaturaId, legislatura) : undefined,
    situacao ? eq(t.peticoes.situacao, situacao) : undefined,
    updatedSince ? gte(t.peticoes.updatedAt, new Date(updatedSince)) : undefined,
    q ? ilike(t.peticoes.assunto, `%${q}%`) : undefined,
  );

  const [rows, totalRows] = await Promise.all([
    db
      .select()
      .from(t.peticoes)
      .where(filters)
      .orderBy(
        c.req.query("sort") === "asc"
          ? sql`${t.peticoes.dataEntrada} ASC NULLS LAST`
          : sql`${t.peticoes.dataEntrada} DESC NULLS LAST`,
        asc(t.peticoes.id),
      )
      .limit(limit)
      .offset(offset),
    db.select({ total: sql<number>`count(*)::int` }).from(t.peticoes).where(filters),
  ]);

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

  const etag = weakEtag(pet.updatedAt);
  c.header("ETag", etag);
  c.header("Cache-Control", "no-cache");
  if (c.req.header("if-none-match") === etag) return c.body(null, 304);

  return c.json({ ...pet, comissoes, documentos });
});

export default app;
