-- Create canonical comissoes table
CREATE TABLE "comissoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"sigla" text
);
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_comissoes_nome" ON "comissoes" ("nome");
--> statement-breakpoint

-- Add comissao_id FK to comissoes_fases
ALTER TABLE "comissoes_fases" ADD COLUMN "comissao_id" integer;
--> statement-breakpoint
ALTER TABLE "comissoes_fases" ADD CONSTRAINT "comissoes_fases_comissao_id_comissoes_id_fk" FOREIGN KEY ("comissao_id") REFERENCES "comissoes"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_comissoes_fases_comissao" ON "comissoes_fases" ("comissao_id");
--> statement-breakpoint

-- Add comissao_id FK to ativ_cms
ALTER TABLE "ativ_cms" ADD COLUMN "comissao_id" integer;
--> statement-breakpoint
ALTER TABLE "ativ_cms" ADD CONSTRAINT "ativ_cms_comissao_id_comissoes_id_fk" FOREIGN KEY ("comissao_id") REFERENCES "comissoes"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_ativ_cms_comissao" ON "ativ_cms" ("comissao_id");
--> statement-breakpoint

-- Populate comissoes from existing comissoesFases (one row per unique normalized name)
INSERT INTO comissoes (nome, sigla)
SELECT DISTINCT ON (lower(trim(nome)))
  trim(nome) AS nome,
  sigla
FROM comissoes_fases
WHERE nome IS NOT NULL
ORDER BY lower(trim(nome)), sigla NULLS LAST;
--> statement-breakpoint

-- Backfill comissao_id on comissoes_fases
UPDATE comissoes_fases cf
SET comissao_id = c.id
FROM comissoes c
WHERE lower(trim(cf.nome)) = lower(trim(c.nome));
--> statement-breakpoint

-- Backfill comissao_id on ativ_cms (nullable — may not match if name only exists in ativCms)
UPDATE ativ_cms a
SET comissao_id = c.id
FROM comissoes c
WHERE lower(trim(a.nome)) = lower(trim(c.nome));
