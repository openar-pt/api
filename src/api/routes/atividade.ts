import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import * as t from "../../db/schema.js";
import { setCache } from "./utils.js";

const app = new Hono();

// GET /deputados/:id/atividade?legislatura=XVII
app.get("/:id/atividade", async (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (!id) return c.json({ error: "Invalid id" }, 400);

  const legislatura = c.req.query("legislatura");

  const where = (table: any) =>
    and(
      eq(table.deputadoId, id),
      legislatura ? eq(table.legislaturaId, legislatura) : undefined,
    );

  const [
    dep,
    iniciativas,
    requerimentos,
    intervencoes,
    actp,
    comissoes,
    atividadesComissao,
    gpa,
    dlp,
    dle,
    relIni,
    relPet,
    relContas,
    relIniEur,
    relPareceres,
    parlJovens,
    dadosLegis,
    scgt,
  ] = await Promise.all([
    db.query.deputados.findFirst({ where: eq(t.deputados.id, id), columns: { id: true, nomeParlamentar: true } }),
    db.select().from(t.ativIni).where(where(t.ativIni)),
    db.select().from(t.ativReq).where(where(t.ativReq)),
    db.select().from(t.ativIntev).where(where(t.ativIntev)),
    db.select().from(t.ativActp).where(where(t.ativActp)),
    db.select().from(t.ativCms).where(where(t.ativCms)),
    db.select().from(t.ativAtividadesComissao).where(where(t.ativAtividadesComissao)),
    db.select().from(t.ativGpa).where(where(t.ativGpa)),
    db.select().from(t.ativDlp).where(where(t.ativDlp)),
    db.select().from(t.ativDle).where(where(t.ativDle)),
    db.select().from(t.ativRelIni).where(where(t.ativRelIni)),
    db.select().from(t.ativRelPet).where(where(t.ativRelPet)),
    db.select().from(t.ativRelContas).where(where(t.ativRelContas)),
    db.select().from(t.ativRelIniEur).where(where(t.ativRelIniEur)),
    db.select().from(t.ativRelPareceres).where(where(t.ativRelPareceres)),
    db.select().from(t.ativParlJovens).where(where(t.ativParlJovens)),
    db.select().from(t.ativDadosLegis).where(where(t.ativDadosLegis)),
    db.select().from(t.ativScgt).where(where(t.ativScgt)),
  ]);

  if (!dep) return c.json({ error: "Not found" }, 404);

  setCache(c);
  return c.json({
    deputado: dep,
    iniciativas,
    requerimentos,
    intervencoes,
    actp,
    comissoes,
    atividadesComissao,
    gpa,
    dlp,
    dle,
    relIni,
    relPet,
    relContas,
    relIniEur,
    relPareceres,
    parlJovens,
    dadosLegis,
    scgt,
  });
});

export default app;
