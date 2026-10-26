const { chromium } = require("playwright");
const fs = require("fs");
const S = process.argv[2];
const cfg = JSON.parse(fs.readFileSync(`${S}/e2e.json`));
const BASE = "http://127.0.0.1:8123";
const shot = (p, n) => p.screenshot({ path: `${S}/e2e/${n}.png` });
async function state(id) {
  const r = await fetch(`${BASE}/api/states/${id}`, { headers: { Authorization: `Bearer ${cfg.admin}` } });
  return r.json();
}
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 393, height: 851 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "de-DE", timezoneId: "Europe/Berlin" });
  const t = cfg.oma;
  await ctx.addInitScript((tokens) => {
    localStorage.setItem("hassTokens", JSON.stringify(tokens));
  }, { ...t, hassUrl: BASE, clientId: BASE + "/", expires: Date.now() + t.expires_in * 1000 });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto(`${BASE}/lovelace/ww`);
  const card = page.locator("curve-scheduler-card");
  await card.locator(".headline").waitFor({ timeout: 30000 });
  console.log("headline:", await card.locator(".headline").textContent());
  await shot(page, "01-today");
  const before = (await state("input_number.zirkulation_soll")).state;

  await card.locator("button.edit").tap();
  const curve = card.locator("curve-scheduler-editor curve-scheduler-curve");
  await curve.locator(".handle").first().waitFor();
  // 1) drag point 05:30 down with real touch events
  const handle = curve.locator(".handle").nth(1);
  await handle.scrollIntoViewIfNeeded();
  const box = await handle.boundingBox();
  const cdp = await ctx.newCDPSession(page);
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
  for (let i = 1; i <= 10; i++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x + i, y: y + i * 4 }] });
  }
  await shot(page, "02-dragging");
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await page.waitForTimeout(200);
  const editor = card.locator("curve-scheduler-editor");
  const pts = () => editor.evaluate((e) => JSON.stringify(e._draft.profiles.workday.points));
  console.log("after drag:", await pts());
  // 2) add a point with the fields
  await editor.locator("button.add-point").tap();
  const newIndex = await editor.evaluate((e) => e._selected);
  const row = editor.locator("table.points tbody tr").nth(newIndex);
  await row.locator("input.value").fill("55");
  await row.locator("input.value").press("Enter");
  await row.locator("input.value").blur();
  console.log("after add:", await pts());
  await shot(page, "03-profile-edited");
  // 3) Saturday -> Werktag
  await editor.locator(".tab").nth(1).tap();
  await editor.locator('select[data-day="sat"]').selectOption("workday");
  await shot(page, "04-week");
  // 4) holiday
  await editor.locator(".tab").nth(2).tap();
  await editor.getByText("+ Ausnahme").tap();
  const ex = editor.locator(".exception").first();
  await ex.locator('input[type="date"]').nth(0).fill("2026-12-24");
  await ex.locator('input[type="date"]').nth(0).dispatchEvent("change");
  await ex.locator('input[type="date"]').nth(1).fill("2027-01-06");
  await ex.locator('input[type="date"]').nth(1).dispatchEvent("change");
  await shot(page, "05-exceptions");
  // 5) save
  await editor.locator("button.save").tap();
  await editor.getByText("Gespeichert.").waitFor({ timeout: 10000 });
  await page.waitForTimeout(500);
  await shot(page, "06-saved");
  const after = await state("input_number.zirkulation_soll");
  const sensor = await state("sensor.zirkulation_setpoint");
  console.log("target before:", before, "after:", after.state, "sensor:", sensor.state, sensor.attributes.profile);
  console.log("errors:", errors.filter((e) => !e.includes("favicon")).join("\n") || "none");
  await browser.close();
})();
