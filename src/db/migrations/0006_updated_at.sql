ALTER TABLE "iniciativas" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "peticoes" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "deputados" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE INDEX "idx_iniciativas_updated_at" ON "iniciativas" ("updated_at");
--> statement-breakpoint
CREATE INDEX "idx_peticoes_updated_at" ON "peticoes" ("updated_at");
