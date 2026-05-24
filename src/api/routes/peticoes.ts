import { Hono } from "hono";
import { and, asc, desc, eq, ilike, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import * as t from "../../db/schema.js";

const app = new Hono();

function parsePage(c: { req: { query: (k: string) => string | undefined } }) {
  const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(c.req.query("limit") ?? "50", 10) || 50));
  return { page, limit, offset: (page - 1) * limit };
}

// GET /peticoes?legislatura=XVII&situacao=...&q=...&page=1&limit=50
app.get("/", async (c) => {
  const { page, limit, offset } = parsePage(c);
  const legislatura = c.req.query("legislatura");
  const situacao = c.req.query("situacao");
  const q = c.req.query("q");

  const filters = and(
    legislatura ? eq(t.peticoes.legislaturaId, legislatura) : undefined,
    situacao ? eq(t.peticoes.situacao, situacao) : undefined,
    q ? ilike(t.peticoes.assunto, `%${q}%`) : undefined,
  );

  const [rows, totalRows] = await Promise.all([
    db
      .select()
      .from(t.peticoes)
      .where(filters)
      .orderBy(desc(t.peticoes.dataEntrada), asc(t.peticoes.id))
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

  return c.json({ ...pet, comissoes, documentos });
});

export default app;
