import { readFileSync } from "node:fs";
import { resolve } from "node:path";

export function setup() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env"), "utf-8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (key && process.env[key] === undefined) {
        process.env[key] = val;
      }
    }
  } catch {
    // no .env file — env vars must be set externally (CI)
  }
}
