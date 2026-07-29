-- Raise source coverage: Petições 45.7% → ~99%, Registo Biográfico 41.9% → ~99%,
-- recover the orador→deputado links, and enforce the FKs the data supports.
-- See docs/ar-source-schema.json and docs/ar-schema-gaps.json for the measurements.

-- ── Oradores → deputados ─────────────────────────────────────────────────────
-- oradores[].deputadosOradores[]. The ETL was reading a field name that does not
-- exist in the feed (`deputados`), so oradores.deputados is null everywhere; that
-- jsonb column is kept for now as a fallback for legislaturas not yet verified.

CREATE TABLE "orador_deputados" (
	"id" serial PRIMARY KEY NOT NULL,
	"orador_id" integer NOT NULL,
	"cadastro_id" text,
	"deputado_id" integer,
	"nome" text,
	"gp" text
);
--> statement-breakpoint
ALTER TABLE "orador_deputados" ADD CONSTRAINT "orador_deputados_orador_id_oradores_id_fk" FOREIGN KEY ("orador_id") REFERENCES "oradores"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "orador_deputados" ADD CONSTRAINT "orador_deputados_deputado_id_deputados_id_fk" FOREIGN KEY ("deputado_id") REFERENCES "deputados"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_orador_deputados_orador" ON "orador_deputados" ("orador_id");
--> statement-breakpoint
CREATE INDEX "idx_orador_deputados_deputado" ON "orador_deputados" ("deputado_id");
--> statement-breakpoint

-- ── Petições: novos campos ───────────────────────────────────────────────────

ALTER TABLE "peticoes" ADD COLUMN "actividade_id" text;
--> statement-breakpoint

ALTER TABLE "peticao_relatores" ADD COLUMN "deputado_id" integer;
--> statement-breakpoint
ALTER TABLE "peticao_relatores" ADD CONSTRAINT "peticao_relatores_deputado_id_deputados_id_fk" FOREIGN KEY ("deputado_id") REFERENCES "deputados"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_peticao_rel_deputado" ON "peticao_relatores" ("deputado_id");
--> statement-breakpoint

-- peticao_comissoes was the only committee reference not pointing at the canonical
-- `comissoes` table. The old text column held the source's IdComissao — keep it
-- under a name that says so, and add the real FK alongside.
ALTER TABLE "peticao_comissoes" RENAME COLUMN "comissao_id" TO "comissao_codigo";
--> statement-breakpoint
ALTER TABLE "peticao_comissoes" ADD COLUMN "comissao_id" integer;
--> statement-breakpoint
ALTER TABLE "peticao_comissoes" ADD CONSTRAINT "peticao_comissoes_comissao_id_comissoes_id_fk" FOREIGN KEY ("comissao_id") REFERENCES "comissoes"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_peticao_cms_comissao" ON "peticao_comissoes" ("comissao_id");
--> statement-breakpoint

-- Backfill by normalized name, as 0005 did for comissoes_fases / ativ_cms.
UPDATE peticao_comissoes p
SET comissao_id = c.id
FROM comissoes c
WHERE lower(trim(p.nome)) = lower(trim(c.nome));
--> statement-breakpoint

-- ── Petições: novas tabelas ──────────────────────────────────────────────────

CREATE TABLE "peticao_relatorio_final" (
	"id" serial PRIMARY KEY NOT NULL,
	"peticao_id" integer NOT NULL,
	"peticao_comissao_id" integer NOT NULL,
	"data" date,
	"votacao_data" date,
	"resultado" text,
	"unanime" boolean,
	"reuniao" text,
	"tipo_reuniao" text,
	"descricao" text,
	"detalhe" text,
	"a_favor" text[],
	"contra" text[],
	"abstencao" text[],
	"ausencias" text[]
);
--> statement-breakpoint
ALTER TABLE "peticao_relatorio_final" ADD CONSTRAINT "peticao_relatorio_final_peticao_id_peticoes_id_fk" FOREIGN KEY ("peticao_id") REFERENCES "peticoes"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "peticao_relatorio_final" ADD CONSTRAINT "peticao_relatorio_final_peticao_comissao_id_peticao_comissoes_id_fk" FOREIGN KEY ("peticao_comissao_id") REFERENCES "peticao_comissoes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_peticao_relfinal_peticao" ON "peticao_relatorio_final" ("peticao_id");
--> statement-breakpoint
CREATE INDEX "idx_peticao_relfinal_cms" ON "peticao_relatorio_final" ("peticao_comissao_id");
--> statement-breakpoint

CREATE TABLE "peticao_comissao_documentos" (
	"id" serial PRIMARY KEY NOT NULL,
	"peticao_id" integer NOT NULL,
	"peticao_comissao_id" integer NOT NULL,
	"tipo_ref" text NOT NULL,
	"data_documento" date,
	"tipo_documento" text,
	"titulo_documento" text,
	"descricao" text,
	"url" text
);
--> statement-breakpoint
ALTER TABLE "peticao_comissao_documentos" ADD CONSTRAINT "peticao_comissao_documentos_peticao_id_peticoes_id_fk" FOREIGN KEY ("peticao_id") REFERENCES "peticoes"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "peticao_comissao_documentos" ADD CONSTRAINT "peticao_comissao_documentos_peticao_comissao_id_peticao_comissoes_id_fk" FOREIGN KEY ("peticao_comissao_id") REFERENCES "peticao_comissoes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_peticao_cms_doc_peticao" ON "peticao_comissao_documentos" ("peticao_id");
--> statement-breakpoint
CREATE INDEX "idx_peticao_cms_doc_cms" ON "peticao_comissao_documentos" ("peticao_comissao_id");
--> statement-breakpoint

CREATE TABLE "peticao_audicoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"peticao_id" integer NOT NULL,
	"peticao_comissao_id" integer NOT NULL,
	"fonte" text NOT NULL,
	"audicao_id" text,
	"data" date,
	"tipo" text,
	"titulo" text,
	"entidades" text[]
);
--> statement-breakpoint
ALTER TABLE "peticao_audicoes" ADD CONSTRAINT "peticao_audicoes_peticao_id_peticoes_id_fk" FOREIGN KEY ("peticao_id") REFERENCES "peticoes"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "peticao_audicoes" ADD CONSTRAINT "peticao_audicoes_peticao_comissao_id_peticao_comissoes_id_fk" FOREIGN KEY ("peticao_comissao_id") REFERENCES "peticao_comissoes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_peticao_audicoes_peticao" ON "peticao_audicoes" ("peticao_id");
--> statement-breakpoint
CREATE INDEX "idx_peticao_audicoes_cms" ON "peticao_audicoes" ("peticao_comissao_id");
--> statement-breakpoint

CREATE TABLE "peticao_pedidos_informacao" (
	"id" serial PRIMARY KEY NOT NULL,
	"peticao_id" integer NOT NULL,
	"peticao_comissao_id" integer NOT NULL,
	"entidades" text[],
	"nr_oficio" text,
	"data_oficio" date,
	"data_resposta" date
);
--> statement-breakpoint
ALTER TABLE "peticao_pedidos_informacao" ADD CONSTRAINT "peticao_pedidos_informacao_peticao_id_peticoes_id_fk" FOREIGN KEY ("peticao_id") REFERENCES "peticoes"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "peticao_pedidos_informacao" ADD CONSTRAINT "peticao_pedidos_informacao_peticao_comissao_id_peticao_comissoes_id_fk" FOREIGN KEY ("peticao_comissao_id") REFERENCES "peticao_comissoes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_peticao_pedinfo_peticao" ON "peticao_pedidos_informacao" ("peticao_id");
--> statement-breakpoint
CREATE INDEX "idx_peticao_pedinfo_cms" ON "peticao_pedidos_informacao" ("peticao_comissao_id");
--> statement-breakpoint

CREATE TABLE "peticao_publicacoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"peticao_id" integer NOT NULL,
	"data" date,
	"legislatura" text,
	"numero" text,
	"sessao_legislativa" text,
	"tipo" text,
	"pub_tp" text,
	"paginas" text[],
	"supl" text,
	"pag_final_diario_supl" text,
	"url_diario" text,
	"id_pag" text,
	"id_deb" text,
	"id_int" text,
	"id_act" text,
	"debate_dt_reu" text,
	"obs" text
);
--> statement-breakpoint
ALTER TABLE "peticao_publicacoes" ADD CONSTRAINT "peticao_publicacoes_peticao_id_peticoes_id_fk" FOREIGN KEY ("peticao_id") REFERENCES "peticoes"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_peticao_pub_peticao" ON "peticao_publicacoes" ("peticao_id");
--> statement-breakpoint

CREATE TABLE "peticao_relacionadas" (
	"id" serial PRIMARY KEY NOT NULL,
	"peticao_id" integer NOT NULL,
	"tipo" text NOT NULL,
	"rel_id" text,
	"rel_numero" text,
	"rel_legislatura" text,
	"rel_sessao" text,
	"rel_tipo" text,
	"rel_desc_tipo" text,
	"rel_assunto" text
);
--> statement-breakpoint
ALTER TABLE "peticao_relacionadas" ADD CONSTRAINT "peticao_relacionadas_peticao_id_peticoes_id_fk" FOREIGN KEY ("peticao_id") REFERENCES "peticoes"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_peticao_relacionadas_peticao" ON "peticao_relacionadas" ("peticao_id");
--> statement-breakpoint
CREATE INDEX "idx_peticao_relacionadas_tipo" ON "peticao_relacionadas" ("tipo");
--> statement-breakpoint

-- ── Registo Biográfico: blocos até agora ignorados ───────────────────────────
-- CadDeputadoLegis carries ParSigla/ParDes — the deputy's *party*, which is
-- distinct from mandatos.grupo_parlamentar and appears nowhere else in the feed.

CREATE TABLE "bio_deputado_legislaturas" (
	"id" serial PRIMARY KEY NOT NULL,
	"deputado_id" integer NOT NULL,
	"leg_des" text,
	"legislatura_id" text,
	"nome_parlamentar" text,
	"gp_sigla" text,
	"gp_des" text,
	"partido_sigla" text,
	"partido_des" text,
	"circulo_des" text,
	"ind_des" text,
	"ind_data" date
);
--> statement-breakpoint
ALTER TABLE "bio_deputado_legislaturas" ADD CONSTRAINT "bio_deputado_legislaturas_deputado_id_deputados_id_fk" FOREIGN KEY ("deputado_id") REFERENCES "deputados"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "bio_deputado_legislaturas" ADD CONSTRAINT "bio_deputado_legislaturas_legislatura_id_legislaturas_id_fk" FOREIGN KEY ("legislatura_id") REFERENCES "legislaturas"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_bio_dep_legis_dep" ON "bio_deputado_legislaturas" ("deputado_id");
--> statement-breakpoint
CREATE INDEX "idx_bio_dep_legis_leg" ON "bio_deputado_legislaturas" ("legislatura_id");
--> statement-breakpoint
CREATE INDEX "idx_bio_dep_legis_partido" ON "bio_deputado_legislaturas" ("partido_sigla");
--> statement-breakpoint

CREATE TABLE "bio_orgaos" (
	"id" serial PRIMARY KEY NOT NULL,
	"deputado_id" integer NOT NULL,
	"tipo" text NOT NULL,
	"org_id" text,
	"org_sigla" text,
	"org_des" text,
	"leg_des" text,
	"legislatura_id" text,
	"situacao" text,
	"cargo" text
);
--> statement-breakpoint
ALTER TABLE "bio_orgaos" ADD CONSTRAINT "bio_orgaos_deputado_id_deputados_id_fk" FOREIGN KEY ("deputado_id") REFERENCES "deputados"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "bio_orgaos" ADD CONSTRAINT "bio_orgaos_legislatura_id_legislaturas_id_fk" FOREIGN KEY ("legislatura_id") REFERENCES "legislaturas"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_bio_orgaos_dep" ON "bio_orgaos" ("deputado_id");
--> statement-breakpoint
CREATE INDEX "idx_bio_orgaos_tipo" ON "bio_orgaos" ("tipo");
--> statement-breakpoint
CREATE INDEX "idx_bio_orgaos_org" ON "bio_orgaos" ("org_id");
--> statement-breakpoint

-- ── Constrain the deputy references that were left unenforced ────────────────
-- Both are already declared as Drizzle relations(); zero orphans measured across
-- XVII (248 autores, 164 relatores). Null out any stragglers from older
-- legislaturas so ADD CONSTRAINT cannot fail on pre-existing data.

UPDATE autores_iniciativas SET deputado_id = NULL
WHERE deputado_id IS NOT NULL AND deputado_id NOT IN (SELECT id FROM deputados);
--> statement-breakpoint
ALTER TABLE "autores_iniciativas" ADD CONSTRAINT "autores_iniciativas_deputado_id_deputados_id_fk" FOREIGN KEY ("deputado_id") REFERENCES "deputados"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint

UPDATE comissao_relatores SET deputado_id = NULL
WHERE deputado_id IS NOT NULL AND deputado_id NOT IN (SELECT id FROM deputados);
--> statement-breakpoint
ALTER TABLE "comissao_relatores" ADD CONSTRAINT "comissao_relatores_deputado_id_deputados_id_fk" FOREIGN KEY ("deputado_id") REFERENCES "deputados"("id") ON DELETE no action ON UPDATE no action;
