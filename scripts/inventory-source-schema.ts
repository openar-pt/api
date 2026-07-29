/**
 * Builds a complete structural inventory of the RAW AR Dados Abertos files
 * (not openar.pt's normalized schema): every field path, observed types,
 * cardinality, presence/null rates, value samples, enum candidates and inferred
 * relations.
 *
 * Input:  data/raw/*.json  (see scripts/download-latest-sources.ts)
 * Output: docs/ar-source-schema.json
 *
 * Run: npx tsx scripts/inventory-source-schema.ts
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { CURRENT_LEGISLATURA } from "../src/etl/sources.js";

const RAW_DIR = join(process.cwd(), "data", "raw");
// --all-legs writes elsewhere: inventorying 60+ files produces ~12MB, too big to
// commit, and the committed doc should describe the data we actually serve.
const ALL_LEGS = process.argv.includes("--all-legs");
const OUT_FILE = join(
  process.cwd(),
  "docs",
  ALL_LEGS ? "ar-source-schema.all-legs.json" : "ar-source-schema.json"
);

const MAX_SAMPLES = 5;
const MAX_ENUM = 40; // scalars with at most this many distinct values are emitted as an enum
const DISTINCT_CAP = 20000; // stop tracking distinct values past this (memory guard)
const MAX_SAMPLE_CHARS = 300;

type Kind = "object" | "array" | "string" | "number" | "boolean" | "null";

interface Node {
  path: string;
  /** Times the key was present on a parent record (array-wrapped counts as one). */
  observations: number;
  /** Times the parent had a record at all — presence = observations / parentRecords. */
  parentRecords: number;
  /** Kind of the value as it sits on the parent (array vs bare). */
  kinds: Partial<Record<Kind, number>>;
  /** Kind of each element once arrays are unwrapped. */
  elementKinds: Partial<Record<Kind, number>>;
  arrayLengths?: { min: number; max: number; total: number; count: number };
  /** Object instances folded into this node (array elements + bare objects). */
  objectRecords: number;
  distinct: Set<string> | null; // null once past DISTINCT_CAP
  samples: unknown[];
  strLen?: { min: number; max: number };
  numRange?: { min: number; max: number };
  formats: Set<string>;
  children: Map<string, Node>;
}

function newNode(path: string): Node {
  return {
    path,
    observations: 0,
    parentRecords: 0,
    kinds: {},
    elementKinds: {},
    objectRecords: 0,
    distinct: new Set<string>(),
    samples: [],
    formats: new Set<string>(),
    children: new Map(),
  };
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/;
const PT_DATE = /^\d{2}[-/]\d{2}[-/]\d{4}$/;
const URL_RE = /^https?:\/\//i;
const NUMERIC_STR = /^-?\d+$/;
const ROMAN_LEG = /^(Constituinte|[IVX]+)$/;

function detectFormat(v: string): string | null {
  if (ISO_DATETIME.test(v)) return "datetime";
  if (ISO_DATE.test(v)) return "date";
  if (PT_DATE.test(v)) return "date-pt";
  if (URL_RE.test(v)) return "url";
  if (NUMERIC_STR.test(v)) return "numeric-string";
  if (ROMAN_LEG.test(v)) return "legislatura-roman";
  if (v.trim() === "") return "empty-string";
  if (/<[a-z][\s\S]*>/i.test(v)) return "html";
  return null;
}

function kindOf(v: unknown): Kind {
  if (v === null || v === undefined) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v === "object" ? "object" : (typeof v as Kind);
}

function bump(rec: Partial<Record<Kind, number>>, k: Kind) {
  rec[k] = (rec[k] ?? 0) + 1;
}

/** One observation of `value` at `node` (as it appears on the parent record). */
function visit(node: Node, value: unknown) {
  node.observations++;
  const kind = kindOf(value);
  bump(node.kinds, kind);

  if (kind === "array") {
    const arr = value as unknown[];
    const s = (node.arrayLengths ??= { min: Infinity, max: 0, total: 0, count: 0 });
    s.min = Math.min(s.min, arr.length);
    s.max = Math.max(s.max, arr.length);
    s.total += arr.length;
    s.count++;
    for (const item of arr) absorb(node, item);
    return;
  }
  absorb(node, value);
}

/** Fold a single unwrapped element into `node`. */
function absorb(node: Node, value: unknown) {
  const kind = kindOf(value);
  bump(node.elementKinds, kind);

  if (kind === "array") {
    for (const item of value as unknown[]) absorb(node, item);
    return;
  }

  if (kind === "object") {
    node.objectRecords++;
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      let child = node.children.get(k);
      if (!child) {
        child = newNode(node.path ? `${node.path}.${k}` : k);
        node.children.set(k, child);
      }
      visit(child, v);
    }
    return;
  }

  if (kind === "null") return;

  const str = typeof value === "string" ? value : String(value);
  if (node.distinct) {
    node.distinct.add(str.length > 200 ? str.slice(0, 200) + "…" : str);
    if (node.distinct.size > DISTINCT_CAP) node.distinct = null;
  }
  if (node.samples.length < MAX_SAMPLES) {
    const sample =
      typeof value === "string" && value.length > MAX_SAMPLE_CHARS
        ? value.slice(0, MAX_SAMPLE_CHARS) + "…"
        : value;
    if (!node.samples.some((s) => s === sample)) node.samples.push(sample);
  }
  if (typeof value === "string") {
    const l = (node.strLen ??= { min: Infinity, max: 0 });
    l.min = Math.min(l.min, value.length);
    l.max = Math.max(l.max, value.length);
    const f = detectFormat(value);
    if (f) node.formats.add(f);
  }
  if (typeof value === "number") {
    const r = (node.numRange ??= { min: Infinity, max: -Infinity });
    r.min = Math.min(r.min, value);
    r.max = Math.max(r.max, value);
    if (!Number.isInteger(value)) node.formats.add("decimal");
  }
}

/** Fill in parentRecords for every child, bottom-up. */
function linkPresence(node: Node) {
  for (const child of node.children.values()) {
    child.parentRecords = node.objectRecords;
    linkPresence(child);
  }
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : +((n / d) * 100).toFixed(2);
}

function serialize(node: Node): Record<string, unknown> {
  const elemTotal = Object.values(node.elementKinds).reduce((s, n) => s + n, 0);
  const asArray = node.kinds.array ?? 0;
  const asNull = node.kinds.null ?? 0;
  // A null is neither an array nor an unwrapped value — excluding it keeps
  // "sometimes a bare object, sometimes an array" from firing on nullable fields.
  const asBare = node.observations - asArray - asNull;

  const out: Record<string, unknown> = {
    observations: node.observations,
    elementTypes: Object.entries(node.elementKinds)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, count, pct: pct(count, elemTotal) })),
  };

  if (node.parentRecords > 0) {
    out.presence = {
      present: node.observations,
      parentRecords: node.parentRecords,
      pct: pct(node.observations, node.parentRecords),
      optional: node.observations < node.parentRecords,
    };
  }

  const nullElements = node.elementKinds.null ?? 0;
  if (asNull > 0) {
    out.nulls = { count: asNull, pctOfObservations: pct(asNull, node.observations) };
  }
  // Nulls sitting *inside* an array, as opposed to the field itself being null.
  if (nullElements > asNull) {
    out.nullElements = { count: nullElements - asNull, pctOfElements: pct(nullElements - asNull, elemTotal) };
  }

  if (asArray > 0) {
    const a = node.arrayLengths!;
    out.cardinality = {
      seenAsArray: asArray,
      seenUnwrapped: asBare,
      minLength: a.min === Infinity ? 0 : a.min,
      maxLength: a.max,
      avgLength: +(a.total / a.count).toFixed(2),
    };
    // The AR feed emits a bare object instead of a 1-element array. Consumers
    // must normalize, so flag it loudly.
    if (asBare > 0) out.polymorphicCardinality = true;
  }

  if (node.strLen && node.strLen.min !== Infinity) {
    out.stringLength = { min: node.strLen.min, max: node.strLen.max };
  }
  if (node.numRange && node.numRange.min !== Infinity) {
    out.numberRange = { min: node.numRange.min, max: node.numRange.max };
  }
  if (node.formats.size) out.formats = [...node.formats].sort();

  const isScalar = node.objectRecords === 0;
  if (isScalar) {
    if (node.distinct) {
      out.distinctValues = node.distinct.size;
      if (node.distinct.size > 0 && node.distinct.size <= MAX_ENUM) {
        out.enum = [...node.distinct].sort();
      } else if (node.samples.length) {
        out.samples = node.samples;
      }
    } else {
      out.distinctValues = `>${DISTINCT_CAP}`;
      if (node.samples.length) out.samples = node.samples;
    }
  }

  if (node.children.size) {
    out.objectRecords = node.objectRecords;
    out.fields = Object.fromEntries(
      [...node.children.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, c]) => [k, serialize(c)])
    );
  }
  return out;
}

/** Flat path → compact type signature. Useful for grepping and for diffing releases. */
function flatten(node: Node, acc: Record<string, string> = {}): Record<string, string> {
  for (const c of node.children.values()) {
    const elems = Object.keys(c.elementKinds).filter((k) => k !== "null");
    let sig = elems.length ? elems.join("|") : "null";
    const asArray = c.kinds.array ?? 0;
    const asBare = c.observations - asArray - (c.kinds.null ?? 0);
    if (asArray > 0) sig = `${sig}[]`;
    if (asArray > 0 && asBare > 0) sig += "?polymorphic";
    if ((c.elementKinds.null ?? 0) > 0) sig += " nullable";
    if (c.parentRecords > 0 && c.observations < c.parentRecords) sig += " optional";
    acc[c.path] = sig;
    flatten(c, acc);
  }
  return acc;
}

const ID_RE = /(id|nr|numero|codigo|cad)$/i;

interface IdField {
  path: string;
  values: Set<string> | null;
  count: number;
}

function collectIdFields(node: Node, out: IdField[] = []): IdField[] {
  for (const [k, c] of node.children) {
    if (c.children.size === 0 && ID_RE.test(k) && c.distinct && c.distinct.size > 0) {
      out.push({ path: c.path, values: c.distinct, count: c.observations });
    }
    collectIdFields(c, out);
  }
  return out;
}

/**
 * Two id-ish fields overlapping is weak evidence on its own: small sequential
 * integers (IniNr, ReqNr, ActNr…) all draw from 1..N and overlap by accident.
 * Weight by leaf-name agreement and by how low-entropy the shared values are.
 */
function confidenceOf(pathA: string, pathB: string, shared: Set<string>, overlap: number): "high" | "medium" | "low" {
  const leaf = (p: string) => p.split(".").pop()!.toLowerCase();
  const sameName = leaf(pathA) === leaf(pathB);
  let smallInts = 0;
  for (const v of shared) {
    const n = Number(v);
    if (Number.isInteger(n) && Math.abs(n) < 10000) smallInts++;
  }
  const lowEntropy = smallInts / shared.size > 0.9;
  if (sameName && overlap >= 0.9 && !lowEntropy) return "high";
  if (sameName && overlap >= 0.9) return "medium";
  if (lowEntropy) return "low";
  return overlap >= 0.9 ? "medium" : "low";
}

/**
 * The AR also publishes an Iniciativas.xsd. It describes the XML export, which
 * is a different serialization from the JSON we consume, so compare the two by
 * case-insensitive element name to see what each format actually carries.
 */
function compareWithXsd(xsdPath: string, jsonFlatPaths: Record<string, string>) {
  let xsd: string;
  try {
    xsd = readFileSync(xsdPath, "utf8");
  } catch {
    return null;
  }
  const xsdNames = new Set<string>();
  for (const m of xsd.matchAll(/<xsd?:element[^>]*\sname="([^"]+)"/g)) {
    const n = m[1];
    if (!n.startsWith("pt_gov_ar_") && !n.startsWith("ArrayOf")) xsdNames.add(n);
  }
  const jsonNames = new Set(Object.keys(jsonFlatPaths).map((p) => p.split(".").pop()!));
  const lower = (s: Set<string>) => new Map([...s].map((n) => [n.toLowerCase(), n]));
  const xl = lower(xsdNames);
  const jl = lower(jsonNames);

  const onlyXsd = [...xl].filter(([k]) => !jl.has(k)).map(([, v]) => v).sort();
  const onlyJson = [...jl].filter(([k]) => !xl.has(k)).map(([, v]) => v).sort();
  const both = [...xl].filter(([k]) => jl.has(k));
  const caseDiffers = both.filter(([k, v]) => jl.get(k) !== v).length;

  return {
    note:
      "The XSD describes the XML export and is auto-inferred from a sample (numeric types are unsignedByte/unsignedShort, i.e. sized to that sample, and repeated groups collapse to xsd:choice). Treat it as a name reference, not as a contract.",
    xsdElementNames: xsdNames.size,
    jsonFieldNames: jsonNames.size,
    sharedNamesCaseInsensitive: both.length,
    nameCaseMismatches: caseDiffers,
    presentInXsdOnly: onlyXsd,
    presentInJsonOnly: onlyJson,
  };
}

/**
 * The AR's Iniciativas PDF ("Significado das Tags", Dezembro 2017) is the only
 * artefact carrying human descriptions per field. Parse its `name  description`
 * tables so the inventory can annotate matching JSON fields.
 * Expects data/raw/Iniciativas.pdf.txt (text extracted from the published PDF).
 */
function parsePdfDescriptions(txtPath: string, knownNames: Set<string>): Map<string, string> {
  const out = new Map<string, string>();
  let text: string;
  try {
    text = readFileSync(txtPath, "utf8");
  } catch {
    return out;
  }
  const known = new Map([...knownNames].map((n) => [n.toLowerCase(), n]));
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !/^\d+$/.test(l));

  let current: string | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === "Nome Descrição") continue;
    const first = line.split(/\s+/)[0];
    const hit = known.get(first.toLowerCase());

    // A line starting with a known field name opens a new entry.
    if (hit && line.length > first.length) {
      current = hit;
      out.set(hit, line.slice(first.length).trim());
      continue;
    }
    // The PDF documents structures the JSON doesn't expose under these names.
    // Their rows still act as boundaries, otherwise one description swallows the
    // rest of the table. Two boundary shapes: a `camelCase Descrição` row, and a
    // struct header — a lone `…Out` line followed by the table's column titles.
    // A `…Out` line NOT followed by them is just the tail of the previous
    // description ("…representados pela estrutura Iniciativas_EventosOut").
    const isStructHeader = /Out$/.test(line) && lines[i + 1] === "Nome Descrição";
    if (isStructHeader || /^[a-z][A-Za-z0-9]*\s+[A-ZÀ-Ý]/.test(line)) {
      current = null;
      continue;
    }
    if (current) {
      const merged = `${out.get(current)} ${line}`.replace(/\s+/g, " ").trim();
      out.set(current, merged.length > 400 ? merged.slice(0, 400) + "…" : merged);
    }
  }
  return out;
}

/** Attach descriptions to every node whose leaf name matches (case-insensitively). */
function annotate(tree: Record<string, unknown>, descriptions: Map<string, string>, counter: { n: number }) {
  const fields = tree.fields as Record<string, Record<string, unknown>> | undefined;
  if (!fields) return;
  const byLower = new Map([...descriptions].map(([k, v]) => [k.toLowerCase(), v]));
  for (const [name, node] of Object.entries(fields)) {
    const d = byLower.get(name.toLowerCase());
    if (d) {
      node.description = d;
      node.descriptionSource = "AR Iniciativas.pdf (Dez 2017)";
      counter.n++;
    }
    annotate(node, descriptions, counter);
  }
}

function main() {
  mkdirSync(join(process.cwd(), "docs"), { recursive: true });
  const files = readdirSync(RAW_DIR)
    .filter((f) => f.endsWith(".json"))
    // Default to the current legislatura (plus the global RegistoBiografico).
    .filter((f) => ALL_LEGS || new RegExp(`(${CURRENT_LEGISLATURA}|RegistoBiografico)\\.json$`).test(f))
    .sort();
  if (files.length === 0) throw new Error(`no JSON files in ${RAW_DIR}`);

  const endpoints: Record<string, unknown> = {};
  const idIndex: Record<string, IdField[]> = {};

  for (const file of files) {
    const full = join(RAW_DIR, file);
    const bytes = statSync(full).size;
    process.stdout.write(`${file} (${(bytes / 1024 / 1024).toFixed(1)}MB)… `);
    const data = JSON.parse(readFileSync(full, "utf8"));

    const root = newNode("");
    visit(root, data);
    linkPresence(root);

    const name = file.replace(/\.json$/, "");
    idIndex[name] = collectIdFields(root);
    const flat = flatten(root);
    endpoints[name] = {
      sourceFile: file,
      fileSizeBytes: bytes,
      rootType: kindOf(data),
      rootRecords: root.objectRecords,
      pathCount: Object.keys(flat).length,
      tree: serialize(root),
      flatPaths: flat,
    };
    console.log(`${Object.keys(flat).length} paths, ${root.objectRecords} root records`);
  }

  // ── field descriptions from the published Iniciativas PDF ───────────────────
  const iniEndpoint = endpoints.IniciativasXVII as
    | { flatPaths: Record<string, string>; tree: Record<string, unknown> }
    | undefined;
  let describedFields = 0;
  if (iniEndpoint) {
    const leafNames = new Set(Object.keys(iniEndpoint.flatPaths).map((p) => p.split(".").pop()!));
    const descriptions = parsePdfDescriptions(join(RAW_DIR, "Iniciativas.pdf.txt"), leafNames);
    const counter = { n: 0 };
    annotate(iniEndpoint.tree, descriptions, counter);
    describedFields = counter.n;
    console.log(`annotated ${counter.n} Iniciativas nodes from ${descriptions.size} PDF descriptions`);
  }

  // ── cross-endpoint relation candidates (value overlap between id-like fields) ─
  const relations: Array<Record<string, unknown>> = [];
  const names = Object.keys(idIndex);
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      for (const a of idIndex[names[i]]) {
        for (const b of idIndex[names[j]]) {
          const av = a.values!, bv = b.values!;
          const [small, big] = av.size <= bv.size ? [av, bv] : [bv, av];
          let hits = 0;
          for (const v of small) if (big.has(v)) hits++;
          const overlap = hits / small.size;
          if (hits >= 10 && overlap >= 0.6) {
            relations.push({
              a: `${names[i]}:${a.path}`,
              b: `${names[j]}:${b.path}`,
              sharedValues: hits,
              overlapOfSmallerSetPct: +(overlap * 100).toFixed(1),
              aDistinct: av.size,
              bDistinct: bv.size,
              confidence: confidenceOf(a.path, b.path, small, overlap),
            });
          }
        }
      }
    }
  }
  relations.sort((x, y) => (y.sharedValues as number) - (x.sharedValues as number));

  const doc = {
    $meta: {
      description:
        "Structural inventory of the ORIGINAL Assembleia da República 'Dados Abertos' JSON files (not openar.pt's normalized schema). Generated from the latest legislature file of each endpoint.",
      generator: "scripts/inventory-source-schema.ts",
      generatedAt: new Date().toISOString(),
      legislatura: ALL_LEGS ? "todas" : CURRENT_LEGISLATURA,
      notes: [
        "presence.pct = share of parent records carrying the field; optional=true means it is missing on some records.",
        "elementTypes are measured AFTER unwrapping arrays, so they describe the values themselves.",
        "cardinality.seenUnwrapped > 0 (polymorphicCardinality) means the feed sometimes emits a bare object instead of a 1-element array — always normalize with a toArray() helper.",
        "'fields' under an array node describe that array's ELEMENTS.",
        "enum is emitted for scalars with <= 40 distinct values; otherwise distinctValues + samples.",
        "relationCandidates are inferred from value overlap between id-like fields; the AR publishes no formal foreign keys. Check `confidence` — small sequential integers (IniNr, ReqNr…) overlap by coincidence.",
        `Field 'description' values come from the AR's Iniciativas PDF (Dez 2017) and are semantics only — the structure around them is measured from the data. ${describedFields} nodes annotated.`,
      ],
      sources: {
        json: "data/raw/*.json — the actual files we ingest; authoritative for structure.",
        xsd: "data/raw/Iniciativas.xsd — auto-inferred schema of the XML export; names only, types unreliable.",
        pdf: "data/raw/Iniciativas.pdf(.txt) — 'Significado das Tags', Dez 2017; authoritative for meaning, stale for structure.",
      },
    },
    endpoints,
    relationCandidates: relations.slice(0, 300),
    xsdComparison: {
      Iniciativas: compareWithXsd(
        join(RAW_DIR, "Iniciativas.xsd"),
        (endpoints.IniciativasXVII as { flatPaths: Record<string, string> })?.flatPaths ?? {}
      ),
    },
  };

  writeFileSync(OUT_FILE, JSON.stringify(doc, null, 2));
  console.log(`\n→ ${OUT_FILE} (${(statSync(OUT_FILE).size / 1024 / 1024).toFixed(1)}MB)`);
}

main();
