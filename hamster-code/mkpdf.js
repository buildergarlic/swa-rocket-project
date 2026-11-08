const { chromium } = require('playwright');
const path = require('path'); const fs = require('fs');
(async () => {
  const dir = path.join(__dirname, 'final');
  const ids = ['01','02','03','04','05','06','07','08','09','10','11'];
  const imgs = ids.map(id => 'data:image/png;base64,' + fs.readFileSync(path.join(dir, id + '.png')).toString('base64'));
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  @page { size: A4 landscape; margin: 8mm; }
  html,body{margin:0;background:#fff6e9}
  .pg{width:100%;height:193mm;display:flex;align-items:center;justify-content:center;page-break-after:always;break-after:page}
  .pg:last-child{page-break-after:auto;break-after:auto}
  img{max-width:100%;max-height:100%;object-fit:contain}
  </style></head><body>${imgs.map(s => `<div class="pg"><img src="${s}"></div>`).join('')}</body></html>`;
  const b = await chromium.launch(); const p = await b.newPage();
  await p.setContent(html, { waitUntil: 'load' });
  await p.pdf({ path: process.argv[2], format: 'A4', landscape: true, printBackground: true, margin: { top: '8mm', bottom: '8mm', left: '8mm', right: '8mm' } });
  await b.close(); console.log('pdf ok');
})();
