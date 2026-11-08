// 사용법: node shoot.js <배율> <출력폴더> 01 02 ...
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [scaleArg, outDir, ...ids] = process.argv.slice(2);
  const dsf = parseFloat(scaleArg) || 1;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: dsf });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  for (const id of ids) {
    const url = 'file://' + path.join(__dirname, 'page.html') + '?p=' + id;
    await page.goto(url);
    await page.waitForFunction(() => window.READY || window.ERR, null, { timeout: 30000 });
    const err = await page.evaluate(() => window.ERR);
    if (err) { console.log(id, 'ERR', err); continue; }
    const el = await page.$('.page');
    const file = path.join(outDir, `${id}.png`);
    await el.screenshot({ path: file });
    const box = await el.boundingBox();
    console.log(id, 'ok', Math.round(box.width), 'x', Math.round(box.height));
  }
  if (errors.length) console.log('page errors:', errors.slice(0, 10).join('\n'));
  await browser.close();
})();
