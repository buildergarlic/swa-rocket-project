const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY }, args:['--ignore-certificate-errors'] });
  const p = await b.newPage({ viewport: { width: 720, height: 405 }, deviceScaleFactor: 1920/720 });
  const fs = require('fs'); const dir = process.cwd() + '/pages/';
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.html')).sort()) {
    await p.goto('file://' + dir + f, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: dir + f.replace('.html', '.png') });
  }
  await b.close();
})();
