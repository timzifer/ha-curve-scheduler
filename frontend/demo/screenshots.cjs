// Regenerate the README screenshots: serve this folder (python3 -m http.server 8765)
// and run `node demo/screenshots.cjs` after `npm run demo:build`.
const { chromium } = require("playwright");
const out = require("path").resolve(__dirname, "../../docs/images");
const base = process.env.DEMO_URL ?? "http://127.0.0.1:8765/demo/index.html";

(async () => {
  const browser = await chromium.launch();
  async function shot(name, { width = 560, query = "", tab, select, mobile = false }) {
    const page = await browser.newPage({
      viewport: { width, height: 3000 },
      deviceScaleFactor: 2,
      locale: query.includes("lang=en") ? "en-GB" : "de-DE",
      isMobile: mobile,
      hasTouch: mobile,
    });
    await page.goto(`${base}?${query}`);
    await page.waitForTimeout(300);
    const card = page.locator("zeitprofil-card");
    if (tab !== undefined) await card.locator(".tab").nth(tab).click();
    if (select !== undefined) {
      await card.locator("zeitprofil-editor zeitprofil-curve").locator(".handle").nth(select).click();
    }
    await page.waitForTimeout(200);
    await card.locator("ha-card").screenshot({ path: `${out}/${name}.png` });
    await page.close();
  }
  await shot("today", {});
  await shot("today-dark-mobile", { width: 360, query: "theme=dark", mobile: true });
  await shot("editor-profiles", { query: "view=full", select: 2 });
  await shot("editor-profiles-mobile", { width: 360, query: "view=full", select: 2, mobile: true });
  await shot("editor-week", { query: "view=full", tab: 1 });
  await shot("editor-exceptions", { query: "view=full", tab: 2 });
  await shot("editor-en", { query: "view=full&lang=en", select: 1 });
  await browser.close();
})();
