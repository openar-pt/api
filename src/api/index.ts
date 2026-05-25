import { Hono } from "hono";
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
import peticoes from "./routes/peticoes.js";
import comissoes from "./routes/comissoes.js";
import { rateLimiter, validateInput } from "./middleware/security.js";

export const app = new Hono();

app.use("*", secureHeaders());
app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "HEAD", "OPTIONS"],
  allowHeaders: ["Content-Type"],
  exposeHeaders: ["X-RateLimit-Limit", "X-RateLimit-Remaining"],
  maxAge: 86400,
}));
app.use("*", logger());
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

// ── Routes ────────────────────────────────────────────────────────────────────

app.route("/meta", meta);
app.route("/", fotos);
app.route("/legislaturas", legislaturas);
app.route("/deputados", deputados);
app.route("/deputados", atividade);
app.route("/iniciativas", iniciativas);
app.route("/votacoes", votacoes);
app.route("/peticoes", peticoes);
app.route("/comissoes", comissoes);

app.notFound((c) => c.json({ error: "Not found" }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: "Internal server error" }, 500);
});
