import { Hono } from "hono";

const app = new Hono();

const CDN = process.env.R2_CDN_URL ?? "https://cdn.openar.pt";

// GET /deputados/:id/foto — redirects to CDN
app.get("/deputados/:id/foto", (c) => {
  const id = parseInt(c.req.param("id"), 10);
  if (!id) return c.json({ error: "Invalid id" }, 400);
  return c.redirect(`${CDN}/fotos/${id}`, 302);
});

export default app;
