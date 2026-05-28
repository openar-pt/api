import { Hono } from "hono";
import { count, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import * as t from "../../db/schema.js";
import { setCache } from "./utils.js";

const app = new Hono();

app.get("/", async (c) => {
  const rows = await db.select().from(t.legislaturas).orderBy(t.legislaturas.dataInicio);
  setCache(c, "long");
  return c.json(rows);
});

app.get("/:id", async (c) => {
  const id = c.req.param("id");

  const leg = await db.query.legislaturas.findFirst({
    where: eq(t.legislaturas.id, id),
  });
  if (!leg) return c.json({ error: "Not found" }, 404);

  const [[{ iniciativasTotal }], [{ deputadosTotal }], [{ votacoesTotal }]] =
    await Promise.all([
      db
        .select({ iniciativasTotal: count() })
        .from(t.iniciativas)
        .where(eq(t.iniciativas.legislaturaId, id)),
      db
        .select({ deputadosTotal: count() })
        .from(t.mandatos)
        .where(eq(t.mandatos.legislaturaId, id)),
      db
        .select({ votacoesTotal: count() })
        .from(t.votacoes)
        .innerJoin(t.iniciativas, eq(t.votacoes.iniciativaId, t.iniciativas.id))
        .where(eq(t.iniciativas.legislaturaId, id)),
    ]);

  setCache(c, "long");
  return c.json({ ...leg, iniciativasTotal, deputadosTotal, votacoesTotal });
});

export default app;
