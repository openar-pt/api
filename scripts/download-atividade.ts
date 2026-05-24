/**
 * Downloads AtividadeDeputado JSON files for all historical legislatures (IV–XVI)
 * using Playwright's response interception — captures the body while the token is fresh.
 *
 * Run: npx tsx scripts/download-atividade.ts
 * Output: data/atividade/AtividadeDeputado<leg>_json.txt
 */

import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const LEGS = ["IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI"];
const OUT_DIR = join(process.cwd(), "data", "atividade");
const PAGE_URL = "https://www.parlamento.pt/Cidadania/Paginas/DAatividadeDeputado.aspx";
const MIN_BYTES = 50_000; // anything smaller is an error page

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    acceptDownloads: true,
  });

  const captured = new Map<string, Buffer>(); // leg → file body

  context.on("response", async (response) => {
    const url = response.url();
    if (!url.includes("doc.txt") && !url.includes("doc.ashx")) return;
    const fichMatch = url.match(/[?&]fich=AtividadeDeputado([^&_]+)_json/);
    if (!fichMatch) return;
    const leg = fichMatch[1] === "Cons" ? "Constituinte" : fichMatch[1];
    if (!LEGS.includes(leg) && leg !== "Constituinte") return;
    if (captured.has(leg)) return;
    try {
      const body = await response.body();
      if (body.length >= MIN_BYTES) {
        captured.set(leg, body);
        console.log(`  Intercepted ${leg} (${Math.round(body.length / 1024)}KB)`);
      } else {
        console.warn(`  ${leg}: response too small (${body.length}B) — skipping`);
      }
    } catch {
      // response already disposed
    }
  });

  const page = await context.newPage();
  console.log("Loading main page…");
  await page.goto(PAGE_URL, { waitUntil: "networkidle", timeout: 30000 });

  // Collect sub-page links
  const subLinks: string[] = await page.evaluate((pagePath) => {
    return Array.from(document.querySelectorAll(`a[href*='${pagePath}']`))
      .map((a) => (a as HTMLAnchorElement).href)
      .filter((h) => !!h);
  }, "DAatividadeDeputado.aspx");

  // Click download links on main page by clicking the <a> element directly
  await clickDownloadLinks(page, captured);

  // Visit sub-pages and click their download links
  for (const href of subLinks) {
    const sub = await context.newPage();
    try {
      await sub.goto(href, { waitUntil: "networkidle", timeout: 30000 });
      await clickDownloadLinks(sub, captured);
    } catch (e) {
      console.warn("  sub-page failed:", href, (e as Error).message?.slice(0, 60));
    } finally {
      await sub.close();
    }
  }

  await browser.close();

  // Write captured files
  console.log(`\nCapturing complete. Saving ${captured.size} files…`);
  for (const leg of LEGS) {
    const body = captured.get(leg);
    if (!body) {
      console.warn(`  ! No data captured for ${leg}`);
      continue;
    }
    try {
      const parsed = JSON.parse(body.toString("utf8"));
      const outFile = join(OUT_DIR, `AtividadeDeputado${leg}_json.txt`);
      writeFileSync(outFile, body);
      console.log(`  ${leg}: saved ${Math.round(body.length / 1024)}KB (${parsed.length} records)`);
    } catch (e) {
      console.error(`  ${leg}: parse error — ${(e as Error).message?.slice(0, 80)}`);
    }
  }

  console.log("\nDone. Files written to", OUT_DIR);
}

async function clickDownloadLinks(
  page: import("playwright").Page,
  captured: Map<string, Buffer>,
) {
  const links = await page.$$("a[href*='doc.txt'], a[href*='doc.ashx']");

  for (const link of links) {
    const href = await link.getAttribute("href") ?? "";
    if (!href.includes("AtividadeDeputado") || !href.includes("_json")) continue;

    const fichMatch = href.match(/[?&]fich=AtividadeDeputado([^&_]+)_json/);
    if (!fichMatch) continue;
    const leg = fichMatch[1] === "Cons" ? "Constituinte" : fichMatch[1];
    if (!LEGS.includes(leg) || captured.has(leg)) continue;

    process.stdout.write(`  Triggering ${leg}… `);
    try {
      // Click the element — this uses the browser's live session/cookies
      await link.click({ modifiers: [] });
      // Wait for the response interceptor to fire
      const deadline = Date.now() + 5000;
      while (!captured.has(leg) && Date.now() < deadline) {
        await page.waitForTimeout(200);
      }
      console.log(captured.has(leg) ? "captured" : "no response");
    } catch (e) {
      console.warn("click failed:", (e as Error).message?.slice(0, 60));
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
