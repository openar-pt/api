import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(resolve(here, "../src/api/docs.html"), "utf-8");

assert.match(html, /<title>API pública de dados parlamentares portugueses \| openAR<\/title>/);
assert.match(html, /<meta name="description" content="[^"]*Assembleia da República Portuguesa[^"]*"\/>/);
assert.match(html, /<link rel="canonical" href="https:\/\/api\.openar\.pt\/"\/>/);
assert.match(html, /<meta property="og:title" content="[^"]+"\/>/);
assert.match(html, /<meta property="og:description" content="[^"]+"\/>/);

console.log("docs.html search metadata");
