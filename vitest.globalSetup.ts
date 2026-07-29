import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Load .env for local development. Values already present in the environment
// win, so this is a no-op in CI and production, where secrets are injected
// before the process starts.
export function setup() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env"), "utf-8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (key && process.env[key] === undefined) process.env[key] = val;
    }
  } catch {
    // No .env — secrets come from the environment.
  }
}
