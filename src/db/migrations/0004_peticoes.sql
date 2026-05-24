CREATE TABLE "peticoes" (
  "id" integer PRIMARY KEY NOT NULL,
  "legislatura_id" text NOT NULL REFERENCES "legislaturas"("id"),
  "numero" text,
  "assunto" text,
  "autor" text,
  "data_entrada" date,
  "assinaturas" integer,
  "assinaturas_inicial" integer,
  "situacao" text,
  "sel" text,
  "obs" text,
  "url_texto" text,
  "data_debate" date
);
--> statement-breakpoint
CREATE TABLE "peticao_comissoes" (
  "id" serial PRIMARY KEY NOT NULL,
  "peticao_id" integer NOT NULL REFERENCES "peticoes"("id"),
  "comissao_id" text,
  "nome" text,
  "numero" text,
  "legislatura" text,
  "sessao" text,
  "situacao" text,
  "data_admissibilidade" date,
  "data_arquivo" date,
  "data_baixa_comissao" date,
  "data_envio_par" date,
  "data_reaberta" date
);
--> statement-breakpoint
CREATE TABLE "peticao_relatores" (
  "id" serial PRIMARY KEY NOT NULL,
  "peticao_id" integer NOT NULL REFERENCES "peticoes"("id"),
  "peticao_comissao_id" integer NOT NULL REFERENCES "peticao_comissoes"("id") ON DELETE CASCADE,
  "nome" text,
  "gp" text,
  "data_nomeacao" date,
  "data_cessacao" date,
  "motivo_cessacao" text
);
--> statement-breakpoint
CREATE TABLE "peticao_documentos" (
  "id" serial PRIMARY KEY NOT NULL,
  "peticao_id" integer NOT NULL REFERENCES "peticoes"("id"),
  "data_documento" date,
  "tipo_documento" text,
  "titulo_documento" text,
  "url" text
);
--> statement-breakpoint
CREATE INDEX "idx_peticoes_legislatura" ON "peticoes" ("legislatura_id");
--> statement-breakpoint
CREATE INDEX "idx_peticoes_situacao" ON "peticoes" ("situacao");
--> statement-breakpoint
CREATE INDEX "idx_peticao_cms_peticao" ON "peticao_comissoes" ("peticao_id");
--> statement-breakpoint
CREATE INDEX "idx_peticao_rel_peticao" ON "peticao_relatores" ("peticao_id");
--> statement-breakpoint
CREATE INDEX "idx_peticao_doc_peticao" ON "peticao_documentos" ("peticao_id");