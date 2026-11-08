// 각 슬라이드에서 글자 상자를 뽑고(text.json), 글자를 숨긴 배경 이미지(bg/sNN.jpg)를 만든다.
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const b = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY }, args:['--ignore-certificate-errors','--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 });
  const dir = __dirname + '/pages/', out = __dirname + '/bg/';
  fs.mkdirSync(out, {recursive:true});
  const all = {};
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.html')).sort()) {
    await p.goto('file://' + dir + f, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    all[f.replace('.html','')] = await p.evaluate(() => {
      const isInline = el => getComputedStyle(el).display.startsWith('inline') && el.tagName !== 'IMG';
      const hasText = el => el.textContent.trim().length > 0;
      const boxes = [];
      const visit = el => {
        if (['SCRIPT','STYLE','SVG','svg'].includes(el.tagName) || el.closest('svg') || el.closest('.foot')) return;
        if (!hasText(el)) return;
        const kids = [...el.children];
        const blockKids = kids.filter(k => !isInline(k) && hasText(k) && k.tagName !== 'BR');
        const ownText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) || kids.some(k => isInline(k) && hasText(k));
        if (blockKids.length === 0) { boxes.push(el); return; }
        if (ownText) {
          // 섞인 경우: 인라인 조각은 각각 상자로
          for (const n of [...el.childNodes]) {
            if (n.nodeType === 3 && n.textContent.trim()) { const s = document.createElement('span'); n.replaceWith(s); s.appendChild(n); s.style.display='inline'; boxes.push(s); }
            else if (n.nodeType === 1 && isInline(n) && hasText(n)) boxes.push(n);
          }
        }
        blockKids.forEach(visit);
      };
      visit(document.body);
      const res = [];
      for (const el of boxes) {
        const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
        if (r.width < 1 || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) continue;
        const runs = []; let lastTop = null, brk = false;
        const walk = (n) => {
          if (n.nodeType === 3) { const raw = n.textContent; if (!raw) return;
            const c0 = getComputedStyle(n.parentElement); const clip = [n.parentElement, ...(n.parentElement.closest('[style*="background-clip"]') ? [n.parentElement.closest('[style*="background-clip"]')] : [])].some(x => getComputedStyle(x).webkitBackgroundClip === 'text'); const c = clip ? {...c0, fontWeight: c0.fontWeight, color: 'rgb(220, 238, 255)', fontSize: c0.fontSize, fontFamily: c0.fontFamily, letterSpacing: c0.letterSpacing} : c0;
            const mk = t => ({t, b: parseInt(c.fontWeight) >= 700, c: c.color, s: parseFloat(c.fontSize), f: c.fontFamily.includes('Montserrat') ? 'Montserrat' : 'Noto Sans KR', ls: c.letterSpacing === 'normal' ? 0 : parseFloat(c.letterSpacing)});
            let cur = '';
            const rg = document.createRange();
            for (let i = 0; i < raw.length; i++) {
              const ch = raw[i];
              if (/\s/.test(ch)) { if (!cur.endsWith(' ') && !cur.endsWith('\v')) cur += ' '; continue; }
              rg.setStart(n, i); rg.setEnd(n, i + 1); const rc = rg.getClientRects()[0];
              if (rc) { if (lastTop !== null && rc.top > lastTop + rc.height * 0.6 && !brk) { cur = cur.replace(/ $/, ''); if (cur || runs.length) cur += '\v'; } lastTop = rc.top; brk = false; }
              cur += ch;
            }
            if (cur) runs.push(mk(cur)); }
          else if (n.nodeName === 'BR') { runs.push({t: '\n'}); brk = true; }
          else n.childNodes.forEach(walk);
        };
        walk(el);
        // trim
        while (runs.length && runs[0].t.trim() === '' ) runs.shift();
        if (runs.length) runs[0].t = runs[0].t.replace(/^[\s\v]+/, '');
        if (runs.length) runs[runs.length-1].t = runs[runs.length-1].t.replace(/\s+$/, '');
        const rng = document.createRange(); rng.selectNodeContents(el); const tr = rng.getBoundingClientRect();
        res.push({x: tr.left, y: tr.top, w: tr.width, h: tr.height, bx: r.left, bw: r.width, align: cs.textAlign, lh: cs.lineHeight === 'normal' ? 1.4 : parseFloat(cs.lineHeight) / parseFloat(cs.fontSize), ls: cs.letterSpacing, runs});
        el.style.setProperty('color', 'transparent', 'important');
        el.querySelectorAll('*').forEach(k => { k.style.setProperty('color', 'transparent', 'important'); k.style.setProperty('-webkit-text-fill-color', 'transparent', 'important'); });
        el.style.setProperty('-webkit-text-fill-color', 'transparent', 'important'); [el, ...el.querySelectorAll('*')].forEach(k => { k.style.setProperty('text-shadow', 'none', 'important'); if (getComputedStyle(k).webkitBackgroundClip === 'text') k.style.setProperty('background', 'none', 'important'); k.style.setProperty('-webkit-text-stroke', '0', 'important'); });
      }
      return res;
    });
    await p.screenshot({ path: out + f.replace('.html', '.jpg'), type:'jpeg', quality: 80 });
  }
  fs.writeFileSync(__dirname + '/text.json', JSON.stringify(all));
  await b.close();
})();
