-- Add biographical fields to deputados
ALTER TABLE "deputados" ADD COLUMN "data_nascimento" date;
--> statement-breakpoint
ALTER TABLE "deputados" ADD COLUMN "sexo" text;
--> statement-breakpoint
ALTER TABLE "deputados" ADD COLUMN "profissao" text;
--> statement-breakpoint

-- Bio sub-tables
CREATE TABLE "bio_habilitacoes" (
  "id" serial PRIMARY KEY NOT NULL,
  "deputado_id" integer NOT NULL REFERENCES "deputados"("id"),
  "hab_id" integer,
  "descricao" text,
  "estado" text,
  "tipo_id" integer
);
--> statement-breakpoint
CREATE TABLE "bio_titulos" (
  "id" serial PRIMARY KEY NOT NULL,
  "deputado_id" integer NOT NULL REFERENCES "deputados"("id"),
  "tit_id" integer,
  "descricao" text,
  "ordem" integer
);
--> statement-breakpoint
CREATE TABLE "bio_cargos_funcoes" (
  "id" serial PRIMARY KEY NOT NULL,
  "deputado_id" integer NOT NULL REFERENCES "deputados"("id"),
  "fun_id" integer,
  "descricao" text,
  "antiga" boolean,
  "ordem" integer
);
--> statement-breakpoint
CREATE TABLE "bio_condecoracoes" (
  "id" serial PRIMARY KEY NOT NULL,
  "deputado_id" integer NOT NULL REFERENCES "deputados"("id"),
  "cod_id" integer,
  "descricao" text,
  "ordem" integer
);
--> statement-breakpoint
CREATE TABLE "bio_obras_publicadas" (
  "id" serial PRIMARY KEY NOT NULL,
  "deputado_id" integer NOT NULL REFERENCES "deputados"("id"),
  "pub_id" integer,
  "descricao" text,
  "ordem" integer
);
--> statement-breakpoint

CREATE INDEX "idx_bio_hab_dep" ON "bio_habilitacoes" ("deputado_id");
--> statement-breakpoint
CREATE INDEX "idx_bio_tit_dep" ON "bio_titulos" ("deputado_id");
--> statement-breakpoint
CREATE INDEX "idx_bio_cargos_dep" ON "bio_cargos_funcoes" ("deputado_id");
--> statement-breakpoint
CREATE INDEX "idx_bio_cond_dep" ON "bio_condecoracoes" ("deputado_id");
--> statement-breakpoint
CREATE INDEX "idx_bio_obras_dep" ON "bio_obras_publicadas" ("deputado_id");
