// Tests the markdown helpers embedded in src/api/docs.html.
//
// OpenAPI 3.1 says `description` fields are CommonMark, so the docs page has to
// render them. These helpers are defined inside a <script> tag; the test pulls
// their source out and evaluates it, so they stay tested without a build step.
//
// Run: node scripts/docs-md.test.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(resolve(here, "../src/api/docs.html"), "utf-8");

// Each helper is written as a top-level function whose closing brace is in
// column 0, so this lifts the whole body out.
function extract(name) {
  const re = new RegExp(`^function ${name}\\([^)]*\\) \\{[\\s\\S]*?^\\}`, "m");
  const m = re.exec(html);
  if (!m) throw new Error(`could not find function ${name}() in docs.html`);
  return m[0];
}

const { esc, mdInline, md } = new Function(
  `${extract("esc")}\n${extract("mdInline")}\n${extract("md")}\nreturn { esc, mdInline, md };`,
)();

let failures = 0;
const ok = (label) => console.log(`  ok   ${label}`);
const bad = (label, detail) => { console.log(`  FAIL ${label}\n       ${detail}`); failures++; };

function check(label, actual, predicate, expectation) {
  predicate(actual) ? ok(label) : bad(label, `${expectation}\n       got: ${actual}`);
}
const has = (needle) => (s) => s.includes(needle);
const lacks = (needle) => (s) => !s.includes(needle);

console.log("docs.html markdown helpers");

// — inline —
check("renders `code` spans", mdInline("use `PS` here"), has("<code>PS</code>"), "expected <code>PS</code>");
check("renders **bold**", mdInline("this is **important**"), has("<strong>important</strong>"), "expected <strong>");
check("renders links", mdInline("see [docs](https://example.com)"),
  has('<a href="https://example.com"'), "expected an anchor");
check("escapes HTML", mdInline('<script>alert(1)</script>'), lacks("<script>"), "must not emit raw <script>");
check("escapes HTML in code spans", mdInline("`<b>`"), lacks("<b>"), "must not emit raw <b>");

// — block —
check("renders ### as a heading", md("### Autenticação\n\nNenhuma."), has("<h4>Autenticação</h4>"), "expected <h4>");
check("wraps prose in paragraphs", md("Uma frase."), has("<p>Uma frase.</p>"), "expected <p>");
check("keeps separate paragraphs apart", md("Um.\n\nDois."),
  (s) => (s.match(/<p>/g) || []).length === 2, "expected exactly 2 <p>");
check("joins soft-wrapped lines", md("linha um\nlinha dois"),
  (s) => s.includes("linha um linha dois"), "single newline should become a space");
check("renders bullet lists", md("- um\n- dois"),
  (s) => s.includes("<ul>") && (s.match(/<li>/g) || []).length === 2, "expected <ul> with 2 <li>");
check("applies inline markdown inside blocks", md("### T\n\nuse `x`"), has("<code>x</code>"), "expected <code> in a paragraph");
check("no literal markdown leaks through", md("### A\n\nuse `b` and **c**"),
  (s) => !s.includes("###") && !s.includes("`") && !s.includes("**"), "raw markdown must not survive");
check("handles empty input", md(""), (s) => s === "", "expected empty string");

// — the actual regression: the real spec description —
const specDesc = [
  "API de dados abertos.", "", "### Autenticação", "Nenhuma. Aceita `GET`.",
].join("\n");
check("regression: multi-line spec description is not a blob", md(specDesc),
  (s) => s.includes("<h4>Autenticação</h4>") && s.includes("<code>GET</code>") && !s.includes("###"),
  "the front-page description must render as structured HTML");

if (failures) { console.log(`\n${failures} test(s) failed`); process.exit(1); }
console.log("\nall tests passed");
