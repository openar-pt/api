import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db } from "./index.js";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const dir = resolve(fileURLToPath(import.meta.url), "../../..", "src/db/migrations");

await migrate(db, { migrationsFolder: dir });
console.log("Migrations applied.");
process.exit(0);
