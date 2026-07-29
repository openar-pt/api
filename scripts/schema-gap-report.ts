/**
 * Compares the AR source inventory (docs/ar-source-schema.json) against what our
 * ETL actually reads and what our DB stores, to surface unmapped source fields.
 *
 * Heuristic: a source field is "referenced" if its name appears as a whole word
 * in the endpoint's normalizer. That over-counts (a name may appear in a comment)
 * but never under-counts, so anything it reports as MISSING really is unread.
 *
 * Run: npx tsx scripts/schema-gap-report.ts            → docs/ar-schema-gaps.json
 *      npx tsx scripts/schema-gap-report.ts --assert   → exit 1 on unread fields
 *
 * --assert is the regression guard: the ETL spent two legislaturas reading a field
 * name the feed does not publish (`oradores.deputados` instead of
 * `deputadosOradores`), writing nulls, and nothing failed. Run it in CI so a
 * renamed or added upstream field breaks the build instead of going unnoticed.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const INVENTORY = join(ROOT, "docs", "ar-source-schema.json");
const OUT_FILE = join(ROOT, "docs", "ar-schema-gaps.json");
const BASELINE_FILE = join(ROOT, "docs", "ar-schema-gaps.baseline.json");

const ASSERT = process.argv.includes("--assert");

/** Endpoint name prefix → the normalizer that reads it, for every legislatura. */
const NORMALIZER_BY_PREFIX: Array<[string, string]> = [
  ["Iniciativas", "src/etl/normalize/iniciativas.ts"],
  ["AtividadeDeputado", "src/etl/normalize/atividade-deputado.ts"],
  ["Peticoes", "src/etl/normalize/peticoes.ts"],
  ["RegistoBiografico", "src/etl/normalize/registo-biografico.ts"],
  ["InformacaoBase", "src/etl/normalize/informacao-base.ts"],
];

function normalizerFor(endpoint: string): string | null {
  // Longest prefix first so "AtividadeDeputado…" never matches a shorter sibling.
  const hit = [...NORMALIZER_BY_PREFIX]
    .sort((a, b) => b[0].length - a[0].length)
    .find(([prefix]) => endpoint.startsWith(prefix));
  return hit ? hit[1] : null;
}

interface NodeDoc {
  observations: number;
  elementTypes: Array<{ type: string; count: number; pct: number }>;
  nulls?: { count: number; pctOfObservations: number };
  description?: string;
  fields?: Record<string, NodeDoc>;
  objectRecords?: number;
  samples?: unknown[];
  enum?: string[];
  distinctValues?: number | string;
}

/** Walk the inventory tree yielding every path with its populated-ness. */
function* walk(node: NodeDoc, prefix = ""): Generator<{ path: string; leaf: string; node: NodeDoc }> {
  if (!node.fields) return;
  for (const [name, child] of Object.entries(node.fields)) {
    const path = prefix ? `${prefix}.${name}` : name;
    yield { path, leaf: name, node: child };
    yield* walk(child, path);
  }
}

function populatedPct(n: NodeDoc): number {
  const nulls = n.nulls?.count ?? 0;
  return n.observations === 0 ? 0 : +(((n.observations - nulls) / n.observations) * 100).toFixed(2);
}

function main() {
  const inv = JSON.parse(readFileSync(INVENTORY, "utf8"));
  const schemaSrc = readFileSync(join(ROOT, "src/db/schema.ts"), "utf8");

  const report: Record<string, unknown> = {};
  const summary: Record<string, unknown> = {};

  // Cache normalizer sources — with every legislatura inventoried this loop runs
  // dozens of times over the same handful of files.
  const sourceCache = new Map<string, string>();
  const sourceOf = (relPath: string) => {
    let src = sourceCache.get(relPath);
    if (src === undefined) {
      src = readFileSync(join(ROOT, relPath), "utf8");
      sourceCache.set(relPath, src);
    }
    return src;
  };
  const allNormalizers = [...new Set(NORMALIZER_BY_PREFIX.map(([, p]) => p))];

  for (const endpoint of Object.keys(inv.endpoints)) {
    const relPath = normalizerFor(endpoint);
    const ep = inv.endpoints[endpoint];
    if (!relPath || !ep) continue;
    const code = sourceOf(relPath);

    const referenced: string[] = [];
    const missing: Array<Record<string, unknown>> = [];
    const alwaysNull: Array<Record<string, unknown>> = [];

    for (const { path, leaf, node } of walk(ep.tree)) {
      const word = new RegExp(`\\b${leaf.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
      const seen = word.test(code);
      const filled = populatedPct(node);
      if (seen) {
        referenced.push(path);
        if (filled === 0) {
          alwaysNull.push({ path, observations: node.observations, description: node.description });
        }
        continue;
      }
      // The same concept often arrives through more than one endpoint (deputy
      // cargos come from InformacaoBase, not AtividadeDeputado). Only a name
      // that appears in NO normalizer and in no DB column is a true gap.
      const elsewhere = allNormalizers
        .filter((p) => p !== relPath)
        .filter((p) => word.test(sourceOf(p)));
      const inDbSchema = word.test(schemaSrc);

      missing.push({
        path,
        populatedPct: filled,
        observations: node.observations,
        types: node.elementTypes.filter((t) => t.type !== "null").map((t) => t.type),
        distinctValues: node.distinctValues,
        samples: node.samples ?? node.enum?.slice(0, 5),
        description: node.description,
        alsoReadBy: elsewhere.length ? elsewhere : undefined,
        // Informational only. It must NOT relax trueGap: schema.ts comments name
        // source fields, so a field could look handled purely because a comment
        // mentions it — which is exactly how the deputadosOradores bug survived.
        nameAppearsInDbSchema: inDbSchema,
        trueGap: elsewhere.length === 0,
      });
    }

    // Unmapped fields that actually carry data are the ones worth acting on.
    missing.sort((a, b) => (b.populatedPct as number) - (a.populatedPct as number));

    report[endpoint] = {
      normalizer: relPath,
      totalPaths: ep.pathCount,
      referencedPaths: referenced.length,
      coveragePct: +((referenced.length / ep.pathCount) * 100).toFixed(1),
      unmappedWithData: missing.filter((m) => (m.populatedPct as number) > 0),
      unmappedAlwaysNull: missing.filter((m) => (m.populatedPct as number) === 0),
      mappedButSourceAlwaysNull: alwaysNull,
    };
    summary[endpoint] = {
      coveragePct: (report[endpoint] as { coveragePct: number }).coveragePct,
      unmappedWithData: missing.filter((m) => (m.populatedPct as number) > 0).length,
      trueGapsWithData: missing.filter((m) => m.trueGap && (m.populatedPct as number) > 0).length,
      unmappedAlwaysNull: missing.filter((m) => (m.populatedPct as number) === 0).length,
      mappedButSourceAlwaysNull: alwaysNull.length,
    };
  }

  // Which inferred cross-endpoint relations does our schema actually model?
  const relationCoverage = (inv.relationCandidates as Array<Record<string, unknown>>)
    .filter((r) => r.confidence !== "low")
    .map((r) => {
      const leafA = (r.a as string).split(".").pop()!;
      const leafB = (r.b as string).split(".").pop()!;
      return {
        ...r,
        // A real FK in our schema shows up as a .references() on a column whose
        // comment or name derives from these source ids.
        modelledInSchema: new RegExp(`\\b${leafA}\\b`).test(schemaSrc) || new RegExp(`\\b${leafB}\\b`).test(schemaSrc),
      };
    });

  const fkCount = (schemaSrc.match(/\.references\(/g) ?? []).length;
  const tableCount = (schemaSrc.match(/= pgTable\(/g) ?? []).length;

  // Columns that hold an identifier but carry no DB-level constraint. These are
  // the source's soft references we chose to store without enforcing.
  const softRefs: Array<{ table: string; column: string; type: string }> = [];
  let currentTable = "";
  for (const line of schemaSrc.split("\n")) {
    const tbl = line.match(/^export const (\w+) = pgTable\(/);
    if (tbl) currentTable = tbl[1];
    const col = line.match(/^\s*(\w+):\s*(text|integer)\("([a-z0-9_]+)"\)/);
    if (!col) continue;
    const [, , colType, dbName] = col;
    if (!/(^|_)id$/.test(dbName) || dbName === "id") continue;
    if (line.includes(".references(")) continue;
    softRefs.push({ table: currentTable, column: dbName, type: colType });
  }

  writeFileSync(
    OUT_FILE,
    JSON.stringify(
      {
        $meta: {
          description:
            "Gap analysis: AR source inventory (docs/ar-source-schema.json) vs our ETL normalizers and DB schema.",
          generatedAt: new Date().toISOString(),
          method:
            "A source path counts as mapped when its leaf name appears as a whole word in the endpoint's normalizer. Over-counts (comments match), never under-counts — so 'unmapped' entries are genuinely unread.",
          dbTables: tableCount,
          dbForeignKeys: fkCount,
        },
        summary,
        softReferences: {
          note: "Identifier columns with no .references() constraint — the source's implicit links, stored but not enforced.",
          count: softRefs.length,
          columns: softRefs,
        },
        relationCoverage,
        endpoints: report,
      },
      null,
      2
    )
  );

  console.log(`db: ${tableCount} tables, ${fkCount} FK references`);
  console.log(`→ ${OUT_FILE}`);

  // Every source path we do not read, keyed "Endpoint:path". Some are legitimate
  // (fields the AR publishes but that carry no data, or that we deliberately skip),
  // so the baseline records what was accepted and the guard only fails on new ones.
  const gaps = new Set<string>();
  for (const [endpoint, r] of Object.entries(report)) {
    const { unmappedWithData } = r as { unmappedWithData: Array<Record<string, unknown>> };
    for (const m of unmappedWithData) {
      if (m.trueGap) gaps.add(`${endpoint}:${m.path}`);
    }
  }

  if (!ASSERT) {
    if (gaps.size) console.log(`\n${gaps.size} unread source field(s) carrying data — run with --assert for the list.`);
    return;
  }

  let baseline: string[] = [];
  try {
    baseline = JSON.parse(readFileSync(BASELINE_FILE, "utf8")).acceptedGaps ?? [];
  } catch {
    console.error(`No baseline at ${BASELINE_FILE} — create it before using --assert.`);
    process.exit(2);
  }

  const accepted = new Set(baseline);
  const novos = [...gaps].filter((g) => !accepted.has(g)).sort();
  const resolvidos = [...accepted].filter((g) => !gaps.has(g)).sort();

  if (resolvidos.length) {
    console.log(`\n${resolvidos.length} baseline entr(y/ies) now read — drop them from the baseline:`);
    for (const g of resolvidos) console.log(`  - ${g}`);
  }

  if (novos.length) {
    console.error(`\n✗ ${novos.length} source field(s) with data are not read by any normalizer:`);
    for (const g of novos) console.error(`  + ${g}`);
    console.error(
      "\nThe AR has added or renamed a field. Read it in the matching normalizer, or " +
      `add it to ${BASELINE_FILE} with a reason if it is intentionally skipped.`
    );
    process.exit(1);
  }

  console.log(`\n✓ no unread source fields beyond the ${accepted.size} accepted in the baseline.`);
}

main();
