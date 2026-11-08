// 슬라이드마다 HTML 글자를 글자 상자 정보(stext.json)로 뽑고, 글자를 지운 배경(sbg/NN.jpg)과 확인용 원본(sref/NN.png)을 만든다.
// 엔트리 블록과 그림(SVG), 번호 동그라미는 배경 그림에 남긴다.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
(async () => {
  const outBg = path.join(__dirname, 'sbg'), outRef = path.join(__dirname, 'sref');
  fs.mkdirSync(outBg, { recursive: true }); fs.mkdirSync(outRef, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1.5 });
  const errs = [];
  p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file://' + path.join(__dirname, 'slide.html') + '?p=00');
  await p.waitForFunction(() => window.READY || window.ERR);
  const order = await p.evaluate(() => SLIDE_ORDER);
  const all = {};
  for (const id of order) {
    await p.goto('file://' + path.join(__dirname, 'slide.html') + '?p=' + id);
    await p.waitForFunction(() => window.READY || window.ERR, null, { timeout: 30000 });
    const err = await p.evaluate(() => window.ERR);
    if (err) throw new Error(id + ' ' + err);
    await p.screenshot({ path: path.join(outRef, id + '.png'), clip: { x: 0, y: 0, width: 1600, height: 900 } });
    all[id] = await p.evaluate(() => {
      const SKIP = 'svg, .num, .cn, .ic, .badge, .toc .no';
      const isInline = el => getComputedStyle(el).display === 'inline' && !el.matches(SKIP);
      const hasText = el => el.textContent.trim().length > 0;
      const boxes = [];
      const visit = el => {
        if (el.matches(SKIP) || el.closest('svg')) return;
        if (!hasText(el)) return;
        const kids = [...el.children];
        const blockKids = kids.filter(k => !isInline(k) && hasText(k) && k.tagName !== 'BR');
        const ownText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) || kids.some(k => isInline(k) && hasText(k));
        if (blockKids.length === 0) { boxes.push(el); return; }
        if (ownText) {
          for (const n of [...el.childNodes]) {
            if (n.nodeType === 3 && n.textContent.trim()) { const s = document.createElement('span'); n.replaceWith(s); s.appendChild(n); s.dataset.wrap = '1'; boxes.push(s); }
            else if (n.nodeType === 1 && isInline(n) && hasText(n)) boxes.push(n);
          }
        }
        blockKids.forEach(visit);
      };
      visit(document.querySelector('.page'));
      const res = [];
      for (const el of boxes) {
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden') continue;
        // 글자 조각과 줄바꿈
        const runs = []; let lastTop = null, brk = false;
        let tx0 = Infinity, ty0 = Infinity, tx1 = -Infinity, ty1 = -Infinity;
        const rg = document.createRange();
        const walk = n => {
          if (n.nodeType === 3) {
            const raw = n.textContent; if (!raw) return;
            const c = getComputedStyle(n.parentElement);
            const fam = c.fontFamily.includes('Jua') ? 'Jua' : 'Noto Sans KR';
            // 보드 코드는 CSS transform: scale()로 줄여 그리므로 글자 크기에 그 배율을 곱한다
            let k = 1;
            for (let a = n.parentElement; a; a = a.parentElement) { const tf = getComputedStyle(a).transform; if (tf && tf !== 'none') k *= Math.hypot(...new DOMMatrix(tf).toFloat64Array().slice(0, 2)); }
            const mk = t => ({ t, w: fam === 'Jua' ? 400 : parseInt(c.fontWeight), c: c.color, s: Math.round(parseFloat(c.fontSize) * k * 100) / 100, f: fam });
            let cur = '';
            for (let i = 0; i < raw.length; i++) {
              const ch = raw[i];
              if (/\s/.test(ch)) { if (cur && !cur.endsWith(' ') && !cur.endsWith('\v')) cur += ' '; else if (!cur && runs.length && !/[ \v\n]$/.test(runs[runs.length - 1].t)) cur += ' '; continue; }
              rg.setStart(n, i); rg.setEnd(n, i + 1);
              const rc = rg.getClientRects()[0];
              if (rc) {
                if (lastTop !== null && rc.top > lastTop + rc.height * 0.6 && !brk) {
                  cur = cur.replace(/ $/, '');
                  if (!cur && runs.length) runs[runs.length - 1].t = runs[runs.length - 1].t.replace(/ $/, '');
                  cur += '\v';
                }
                lastTop = rc.top; brk = false;
                tx0 = Math.min(tx0, rc.left); ty0 = Math.min(ty0, rc.top); tx1 = Math.max(tx1, rc.right); ty1 = Math.max(ty1, rc.bottom);
              }
              cur += ch;
            }
            if (cur) runs.push(mk(cur));
          } else if (n.nodeName === 'BR') { runs.push({ t: '\n' }); brk = true; }
          else if (n.nodeType === 1 && !n.matches(SKIP)) {
            n.childNodes.forEach(walk);
            // 오른쪽 여백이 있는 글자 조각(번호 등) 뒤에는 띄어쓰기를 넣는다
            if ((parseFloat(getComputedStyle(n).marginRight) || 0) >= 3 && runs.length && !/[\s\v]$/.test(runs[runs.length - 1].t || '')) runs[runs.length - 1].t += ' ';
          }
        };
        walk(el);
        while (runs.length && !runs[0].s) runs.shift();
        if (!runs.length || tx0 === Infinity) continue;
        runs[0].t = runs[0].t.replace(/^[\s\v]+/, '');
        runs[runs.length - 1].t = runs[runs.length - 1].t.replace(/\s+$/, '');
        // 상자: 글자 영역 + 요소의 안쪽 폭
        const r = el.getBoundingClientRect();
        let cw = tx1 - tx0;
        if (!el.dataset.wrap && cs.display !== 'inline') {
          cw = Math.max(cw, r.width - parseFloat(cs.borderLeftWidth) - parseFloat(cs.borderRightWidth) - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight));
        }
        const al = cs.textAlign;
        const lh = cs.lineHeight === 'normal' ? null : parseFloat(cs.lineHeight) / parseFloat(cs.fontSize);
        res.push({ tx0, ty0, tx1, ty1, cw, align: al, lh, runs, cls: el.className || el.parentElement.className });
        // 글자 숨기기
        [el, ...el.querySelectorAll('*')].forEach(k => {
          if (k.closest('svg') || k.matches(SKIP) || k.closest('.num, .cn, .ic, .badge, .toc .no')) return;
          k.style.setProperty('color', 'transparent', 'important');
          k.style.setProperty('text-shadow', 'none', 'important');
        });
      }
      return res;
    });
    await p.screenshot({ path: path.join(outBg, id + '.jpg'), type: 'jpeg', quality: 90, clip: { x: 0, y: 0, width: 1600, height: 900 } });
    console.log(id, all[id].length, 'boxes');
  }
  fs.writeFileSync(path.join(__dirname, 'stext.json'), JSON.stringify(all));
  if (errs.length) console.log('errors', errs);
  await b.close();
})();
