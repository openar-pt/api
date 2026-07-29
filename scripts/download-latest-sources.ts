/**
 * Downloads AR Dados Abertos JSON files straight from the URLs in
 * src/etl/sources.ts, for schema inventory purposes.
 *
 * Run: npx tsx scripts/download-latest-sources.ts             (latest legislatura only)
 *      npx tsx scripts/download-latest-sources.ts --all-legs  (every legislatura)
 * Output: data/raw/<Endpoint><Leg>.json
 *
 * --all-legs is what the schema inventory needs before an ETL change is rolled
 * out to `load.ts --force-all`: older legislaturas use different field names and
 * envelopes, and measuring only the current one hides that.
 */

import { existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import https from "node:https";
import {
  INFORMACAO_BASE,
  INICIATIVAS,
  ATIVIDADE_DEPUTADO,
  PETICOES,
  REGISTO_BIOGRAFICO,
  CURRENT_LEGISLATURA as LEG,
} from "../src/etl/sources.js";
import { agent } from "../src/etl/http.js";

const OUT_DIR = join(process.cwd(), "data", "raw");
const MIN_BYTES = 10_000;

const ALL_LEGS = process.argv.includes("--all-legs");

/** [outputName, url] pairs. RegistoBiografico is a single global registry. */
function targets(): Array<[string, string]> {
  if (!ALL_LEGS) {
    return [
      [`InformacaoBase${LEG}`, INFORMACAO_BASE[LEG]],
      [`Iniciativas${LEG}`, INICIATIVAS[LEG]],
      [`AtividadeDeputado${LEG}`, ATIVIDADE_DEPUTADO[LEG]],
      [`Peticoes${LEG}`, PETICOES[LEG]],
      ["RegistoBiografico", REGISTO_BIOGRAFICO],
    ];
  }
  const out: Array<[string, string]> = [];
  const maps: Array<[string, Record<string, string>]> = [
    ["InformacaoBase", INFORMACAO_BASE],
    ["Iniciativas", INICIATIVAS],
    ["AtividadeDeputado", ATIVIDADE_DEPUTADO],
    ["Peticoes", PETICOES],
  ];
  for (const [name, map] of maps) {
    for (const leg of Object.keys(map)) out.push([`${name}${leg}`, map[leg]]);
  }
  out.push(["RegistoBiografico", REGISTO_BIOGRAFICO]);
  return out;
}

function get(url: string, redirects = 5): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https
      .get(url, { agent, headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          if (redirects === 0) return reject(new Error("too many redirects"));
          res.resume();
          return resolve(get(new URL(res.headers.location, url).toString(), redirects - 1));
        }
        if (res.statusCode && res.statusCode >= 400) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });
  const list = targets();
  const failures: string[] = [];

  for (const [name, url] of list) {
    const out = join(OUT_DIR, `${name}.json`);
    // Resumable: 70+ files over a rate-limited host, so don't refetch what we have.
    if (existsSync(out) && statSync(out).size >= MIN_BYTES) {
      console.log(`${name}… cached`);
      continue;
    }
    process.stdout.write(`${name}… `);
    try {
      const body = await get(url);
      if (body.length < MIN_BYTES) {
        console.log(`FAIL (${body.length}B) ${body.subarray(0, 120).toString().replace(/\s+/g, " ")}`);
        failures.push(name);
        continue;
      }
      JSON.parse(body.toString("utf8")); // validate
      writeFileSync(out, body);
      console.log(`ok ${(body.length / 1024 / 1024).toFixed(1)}MB`);
    } catch (e) {
      console.log(`FAIL ${(e as Error).message}`);
      failures.push(name);
    }
    await new Promise((r) => setTimeout(r, 3000)); // be polite / rate-limit safe
  }

  console.log(`\n${list.length - failures.length}/${list.length} ok`);
  if (failures.length) console.log(`failed: ${failures.join(", ")}`);
}

main();
