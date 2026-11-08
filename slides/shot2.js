const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY }, args:['--ignore-certificate-errors','--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 });
  const fs = require('fs'); const dir = __dirname + '/pages/'; const out = __dirname + '/deck2/';
  fs.mkdirSync(out, {recursive:true});
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.html')).sort()) {
    await p.goto('file://' + dir + f, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: out + f.replace('.html', '.jpg'), type:'jpeg', quality: 88 });
  }
  await b.close();
})();
