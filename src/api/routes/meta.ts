import { Hono } from "hono";
import { sql } from "drizzle-orm";
import { db } from "../../db/index.js";

const app = new Hono();

// GET /meta?legislatura=XVII — filter option values derived from live data
app.get("/", async (c) => {
  const legislatura = c.req.query("legislatura");

  const [legislaturas, grupos, tipos, estados] = await Promise.all([
    db.execute(sql`
      SELECT legislatura_id AS id
      FROM (
        SELECT DISTINCT legislatura_id FROM mandatos
        UNION
        SELECT DISTINCT legislatura_id FROM iniciativas
      ) u
      ORDER BY legislatura_id DESC
    `).then(r => r.rows.map((x: Record<string, unknown>) => x.id as string)),

    legislatura
      ? db.execute(sql`
          SELECT DISTINCT grupo_parlamentar AS grupo
          FROM mandatos
          WHERE grupo_parlamentar IS NOT NULL
            AND legislatura_id = ${legislatura}
          ORDER BY grupo_parlamentar
        `).then(r => r.rows.map((x: Record<string, unknown>) => x.grupo as string))
      : db.execute(sql`
          SELECT DISTINCT grupo_parlamentar AS grupo
          FROM mandatos
          WHERE grupo_parlamentar IS NOT NULL
          ORDER BY grupo_parlamentar
        `).then(r => r.rows.map((x: Record<string, unknown>) => x.grupo as string)),

    legislatura
      ? db.execute(sql`
          SELECT DISTINCT tipo, tipo_desc
          FROM iniciativas
          WHERE tipo IS NOT NULL AND tipo_desc IS NOT NULL
            AND legislatura_id = ${legislatura}
          ORDER BY tipo_desc
        `).then(r => r.rows.map((x: Record<string, unknown>) => ({ tipo: x.tipo as string, tipoDesc: x.tipo_desc as string })))
      : db.execute(sql`
          SELECT DISTINCT tipo, tipo_desc
          FROM iniciativas
          WHERE tipo IS NOT NULL AND tipo_desc IS NOT NULL
          ORDER BY tipo_desc
        `).then(r => r.rows.map((x: Record<string, unknown>) => ({ tipo: x.tipo as string, tipoDesc: x.tipo_desc as string }))),

    legislatura
      ? db.execute(sql`
          SELECT DISTINCT estado
          FROM iniciativas
          WHERE estado IS NOT NULL
            AND legislatura_id = ${legislatura}
          ORDER BY estado
        `).then(r => r.rows.map((x: Record<string, unknown>) => x.estado as string))
      : db.execute(sql`
          SELECT DISTINCT estado
          FROM iniciativas
          WHERE estado IS NOT NULL
          ORDER BY estado
        `).then(r => r.rows.map((x: Record<string, unknown>) => x.estado as string)),
  ]);

  return c.json({ legislaturas, grupos, tipos, estados });
});

export default app;
