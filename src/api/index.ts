import { Hono } from "hono";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spec } from "./openapi.js";
import legislaturas from "./routes/legislaturas.js";
import deputados from "./routes/deputados.js";
import iniciativas from "./routes/iniciativas.js";
import votacoes from "./routes/votacoes.js";
import meta from "./routes/meta.js";
import fotos from "./routes/fotos.js";
import atividade from "./routes/atividade.js";
import intervencoes from "./routes/intervencoes.js";
import peticoes from "./routes/peticoes.js";
import comissoes from "./routes/comissoes.js";
import { rateLimiter, validateInput } from "./middleware/security.js";

export const app = new Hono();

app.use("*", secureHeaders());
app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "HEAD", "OPTIONS"],
  allowHeaders: ["Content-Type", "If-None-Match"],
  exposeHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining", "Retry-After", "ETag"],
  maxAge: 86400,
}));
app.use("*", logger());
app.use("*", compress());
app.use("*", rateLimiter());
app.use("*", validateInput());

// ── Docs ──────────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const docsHtml = readFileSync(join(__dirname, "docs.html"), "utf-8");

app.get("/openapi.json", (c) => c.json(spec));

app.get("/", (c) => {
  c.header("Content-Type", "text/html; charset=utf-8");
  return c.body(docsHtml);
});

// ── Versioned routes ──────────────────────────────────────────────────────────

const v1 = new Hono();
v1.route("/meta", meta);
v1.route("/", fotos);
v1.route("/legislaturas", legislaturas);
v1.route("/deputados", deputados);
v1.route("/deputados", atividade);
v1.route("/deputados", intervencoes);
v1.route("/iniciativas", iniciativas);
v1.route("/votacoes", votacoes);
v1.route("/peticoes", peticoes);
v1.route("/comissoes", comissoes);

app.route("/v1", v1);

app.notFound((c) => c.json({ error: "Not found" }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});
