/**
 * Scrapes parlamento.pt open data pages to discover correct download URLs.
 * Run: npx tsx scripts/scrape-urls.ts
 */

import { chromium } from "playwright";

const SOURCE_TYPE = (fich: string) => {
  if (/AtividadeDeputado/i.test(fich)) return "AtividadeDeputado";
  if (/InformacaoBase/i.test(fich)) return "InformacaoBase";
  if (/Iniciativas/i.test(fich)) return "Iniciativas";
  return "Other";
};

const LEG_FROM_FICH = (fich: string) => {
  const m = fich.match(/(?:InformacaoBase|Iniciativas|AtividadeDeputado)(Cons|[IVX]+)_json/);
  return m ? (m[1] === "Cons" ? "Constituinte" : m[1]) : null;
};

type Found = { type: string; leg: string | null; fich: string; url: string };

const LEG_LABEL_RE = /^(XVII|XVI|XV|XIV|XIII|XII|XI|X|IX|VIII|VII|VI|V|IV|III|II|I)\s+Legislatura$/i;

async function extractDocUrls(page: import("playwright").Page): Promise<Found[]> {
  const found: Found[] = [];
  const docUrls: string[] = await page.evaluate(() => {
    return Array.from(document.querySelectorAll("a[href*='doc.txt']"))
      .map(a => (a as HTMLAnchorElement).href);
  });
  // Also scan page source for embedded URLs
  const content = await page.content();
  const urlMatches = content.matchAll(/https?:\/\/app\.parlamento\.pt\/webutils\/docs\/doc\.txt\?[^"'\s<>]+/g);
  const allUrls = new Set([...docUrls, ...[...urlMatches].map(m => m[0].replace(/&amp;/g, "&"))]);

  for (const u of allUrls) {
    const fichMatch = u.match(/[?&]fich=([^&"'\s]+)/);
    if (!fichMatch) continue;
    const fich = decodeURIComponent(fichMatch[1]);
    const type = SOURCE_TYPE(fich);
    const leg = LEG_FROM_FICH(fich);
    found.push({ type, leg, fich, url: u });
  }
  return found;
}

async function scrapeSection(
  context: import("playwright").BrowserContext,
  mainUrl: string,
  label: string,
  pagePath: string,
): Promise<Found[]> {
  const allFound: Found[] = [];

  const page = await context.newPage();
  console.log(`\nLoading ${label}: ${mainUrl}`);
  await page.goto(mainUrl, { waitUntil: "networkidle", timeout: 30000 });

  // Extract direct doc.txt links from the main page (covers current legislature)
  const mainFound = await extractDocUrls(page);
  allFound.push(...mainFound);
  console.log(`  Main page: ${mainFound.length} links`);

  // Find all legislature sub-page links
  const legLinks: { text: string; href: string }[] = await page.evaluate((pagePath) => {
    return Array.from(document.querySelectorAll(`a[href*='${pagePath}']`))
      .map(a => ({
        text: (a.textContent ?? "").trim(),
        href: (a as HTMLAnchorElement).href,
      }))
      .filter(x => /legislat|constituinte/i.test(x.text));
  }, pagePath);

  console.log(`  Found ${legLinks.length} legislature sub-links`);

  for (const { text, href } of legLinks) {
    if (!href || href === mainUrl) continue;
    const subPage = await context.newPage();
    try {
      await subPage.goto(href, { waitUntil: "networkidle", timeout: 30000 });
      const subFound = await extractDocUrls(subPage);
      for (const f of subFound) console.log(`    [${f.type}] ${f.leg ?? text} — ${f.fich}`);
      allFound.push(...subFound);
    } catch (e) {
      console.log(`    ! Failed to load ${text}: ${(e as Error).message?.slice(0, 80)}`);
    } finally {
      await subPage.close();
    }
  }

  await page.close();
  return allFound;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });

  const allFound: Found[] = [];

  const sections = [
    {
      url: "https://www.parlamento.pt/Cidadania/Paginas/DAInformacaoBase.aspx",
      label: "InformacaoBase",
      pagePath: "DAInformacaoBase.aspx",
    },
    {
      url: "https://www.parlamento.pt/Cidadania/Paginas/DAatividadeDeputado.aspx",
      label: "AtividadeDeputado",
      pagePath: "DAatividadeDeputado.aspx",
    },
    {
      url: "https://www.parlamento.pt/Cidadania/Paginas/DAIniciativas.aspx",
      label: "Iniciativas",
      pagePath: "DAIniciativas.aspx",
    },
  ];

  for (const s of sections) {
    const found = await scrapeSection(context, s.url, s.label, s.pagePath);
    allFound.push(...found);
  }

  await browser.close();

  // Deduplicate by fich name
  const byFich = new Map<string, Found>();
  for (const f of allFound) byFich.set(f.fich, f);
  const unique = [...byFich.values()];

  console.log("\n\n── Final Results ──\n");
  const byType: Record<string, Found[]> = {};
  for (const f of unique) (byType[f.type] ??= []).push(f);

  for (const [type, items] of Object.entries(byType)) {
    console.log(`\n// ── ${type}`);
    const sorted = [...new Map(items.map(i => [i.leg ?? i.fich, i])).values()]
      .sort((a, b) => (a.leg ?? "").localeCompare(b.leg ?? ""));
    for (const item of sorted) {
      console.log(`  ${JSON.stringify(item.leg)}: ${JSON.stringify(item.url)},`);
    }
  }

  if (unique.length === 0) {
    console.log("No URLs found.");
  }
}

main().catch(e => { console.error(e); process.exit(1); });
