// 사용법: node slideshot.js <배율> <출력폴더> [id ...]  (id 없으면 전부)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [scaleArg, outDir, ...ids0] = process.argv.slice(2);
  const dsf = parseFloat(scaleArg) || 1;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: dsf });
  const page = await ctx.newPage();
  const logs = [];
  page.on('pageerror', e => logs.push('ERR ' + e));
  page.on('console', m => logs.push(m.text()));
  let ids = ids0;
  if (!ids.length) { await page.goto('file://' + path.join(__dirname, 'slide.html') + '?p=00'); await page.waitForFunction(() => window.READY || window.ERR); ids = await page.evaluate(() => SLIDE_ORDER); }
  for (const id of ids) {
    logs.length = 0;
    await page.goto('file://' + path.join(__dirname, 'slide.html') + '?p=' + id);
    await page.waitForFunction(() => window.READY || window.ERR, null, { timeout: 30000 });
    const err = await page.evaluate(() => window.ERR);
    if (err) { console.log(id, 'ERR', err); continue; }
    const info = await page.evaluate(() => {
      const pg = document.querySelector('.page');
      const pr = pg.getBoundingClientRect();
      const over = [];
      pg.querySelectorAll('*').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.width === 0) return;
        if (r.bottom > pr.bottom - 4 || r.right > pr.right + 1) over.push((el.className && el.className.baseVal === undefined ? el.className : el.tagName) + ' b=' + Math.round(r.bottom) + ' r=' + Math.round(r.right));
      });
      const foot = pg.querySelector('.foot');
      const body = pg.querySelector('.body');
      return { over: over.slice(0, 6), footBottom: foot ? Math.round(foot.getBoundingClientRect().bottom) : null, bodyOverflow: body ? body.scrollHeight - body.clientHeight : 0 };
    });
    await page.screenshot({ path: path.join(outDir, `${id}.png`), clip: { x: 0, y: 0, width: 1600, height: 900 } });
    console.log(id, 'foot', info.footBottom, 'bodyOverflow', info.bodyOverflow, info.over.length ? 'OVER ' + info.over.join(' | ') : '', logs.filter(l => /scaled|ERR/.test(l)).join(' ; '));
  }
  await browser.close();
})();
