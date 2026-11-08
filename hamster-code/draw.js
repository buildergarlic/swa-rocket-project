// 페이지 조립 도우미와 그림(직접 그린 SVG)
(function () {
  const INK = '#5a4636';
  window.POST = [];

  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const k in (attrs || {})) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'html') el.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else el.setAttribute(k, v);
    }
    kids.flat().forEach(c => { if (c == null || c === false) return; el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return el;
  }
  const H = html => { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; };

  // 햄찌봇(이 프로젝트 전자칠판 화면에서 쓰는 캐릭터와 같은 그림)
  function mascot(cls = 'mascot') {
    const O = `stroke="${INK}" stroke-width="4"`;
    return H(`<svg class="${cls}" viewBox="-60 -62 120 128" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="0" cy="58" rx="46" ry="7" fill="${INK}" opacity=".18"/>
      <circle cx="-30" cy="-34" r="13" fill="#ffc9a3" ${O}/><circle cx="30" cy="-34" r="13" fill="#ffc9a3" ${O}/>
      <circle cx="-30" cy="-34" r="6" fill="#ffaec4"/><circle cx="30" cy="-34" r="6" fill="#ffaec4"/>
      <rect x="-44" y="-30" width="88" height="80" rx="38" fill="#ffd9b8" ${O}/>
      <ellipse cx="0" cy="22" rx="26" ry="20" fill="#fff6ea"/>
      <circle cx="-15" cy="0" r="5.5" fill="${INK}"/><circle cx="15" cy="0" r="5.5" fill="${INK}"/>
      <circle cx="-13" cy="-2" r="2" fill="#fff"/><circle cx="17" cy="-2" r="2" fill="#fff"/>
      <ellipse cx="-28" cy="12" rx="7" ry="4.5" fill="#ffaec4"/><ellipse cx="28" cy="12" rx="7" ry="4.5" fill="#ffaec4"/>
      <path d="M-5,9 Q0,14 5,9" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
      <path d="M0,-30 V-44" stroke="${INK}" stroke-width="3"/><circle cx="0" cy="-48" r="5" fill="#ffe36e" stroke="${INK}" stroke-width="2.5"/>
      <rect x="-36" y="44" width="20" height="12" rx="6" fill="#8fb8ff" stroke="${INK}" stroke-width="3"/><rect x="16" y="44" width="20" height="12" rx="6" fill="#8fb8ff" stroke="${INK}" stroke-width="3"/>
    </svg>`);
  }

  function head({ no, lesson, tags = [], title, sub }) {
    return h('div', { class: 'head' },
      h('div', { class: 'badge' }, h('small', {}, '순서'), h('b', {}, no)),
      h('div', { class: 'titles' },
        h('div', { class: 'kicker' }, ...[lesson && h('span', { class: 'tag butter' }, lesson), ...tags.map(t => h('span', { class: 'tag ' + (t.c || '') }, t.v))]),
        h('h1', {}, title),
        sub && h('div', { class: 'sub', html: sub })),
      mascot());
  }
  function foot(no) {
    return h('div', { class: 'foot' }, h('span', {}, '경남 로켓 발사 작전 · 햄스터봇 택배 코딩'), h('span', {}, `${no} / 11`));
  }

  // ---------- 엔트리 작업판 + 설명 ----------
  // notes: [{id, n, text}], brackets: [{from, to, color, label, sub}]
  function board({ label = '엔트리 코드', list, scale = 2, notes = [], brackets = [], noteGap = 46, noteWidth = 470, extraRight = 0, style = {} }) {
    const r = EB.render(list, { scale });
    const code = h('div', { class: 'code' });
    code.innerHTML = r.svg;
    const svgW = r.W, svgH = r.H;
    const rowsById = {};
    r.rows.forEach(o => { if (o.id) rowsById[o.id] = o; });
    let rightX = svgW;
    const leaders = [];
    const noteEls = [];
    const maxRow = Math.max(...r.rows.map(o => o.x + o.w));
    if (notes.length) {
      const nx = maxRow + noteGap;
      notes.forEach(nt => {
        const row = rowsById[nt.id];
        if (!row) throw new Error('row not found ' + nt.id);
        const cy = row.y + row.h / 2 + 4 * scale;
        const el = h('div', { class: 'note', style: { left: nx + 'px', top: '0px', width: noteWidth + 'px' } },
          nt.n != null ? h('span', { class: 'num' }, String(nt.n)) : null,
          h('span', { class: 'txt', html: nt.text }));
        code.appendChild(el);
        noteEls.push({ el, cy, x1: row.x + row.w + 6, nx });
      });
      rightX = nx + noteWidth;
    }
    if (brackets.length) {
      const bx = maxRow + 18;
      brackets.forEach(bk => {
        const a = rowsById[bk.from], b = rowsById[bk.to];
        if (!a || !b) throw new Error('bracket rows ' + bk.from + ' ' + bk.to);
        const top = a.y + 6, bottom = b.y + b.h + 4;
        code.appendChild(h('div', { class: 'bracket', style: { left: bx + 'px', top: top + 'px', height: (bottom - top) + 'px', width: '22px', borderColor: bk.color } }));
        const lab = h('div', { class: 'blabel', style: { left: (bx + 36) + 'px', top: '0px', width: (bk.width || 430) + 'px' } },
          h('span', { class: 'txt', style: { background: bk.bg || '#fff' }, html: bk.label + (bk.sub ? `<small>${bk.sub}</small>` : '') }));
        code.appendChild(lab);
        POST.push(() => { lab.style.top = ((top + bottom) / 2 - lab.offsetHeight / 2) + 'px'; });
      });
      rightX = Math.max(rightX, bx + 36 + Math.max(...brackets.map(b => b.width || 430)));
    }
    const svgL = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgL.setAttribute('class', 'leaders');
    code.appendChild(svgL);
    code.style.width = (rightX + extraRight) + 'px';
    code.style.height = svgH + 'px';
    if (noteEls.length) {
      POST.push(() => {
        // 겹치지 않게 아래로 밀기
        let prevBottom = -Infinity;
        noteEls.sort((p, q) => p.cy - q.cy).forEach(n => {
          const hgt = n.el.offsetHeight;
          let top = n.cy - hgt / 2;
          if (top < prevBottom + 8) top = prevBottom + 8;
          n.el.style.top = top + 'px';
          prevBottom = top + hgt;
          n.top = top; n.hgt = hgt;
        });
        const maxBottom = Math.max(svgH, prevBottom + 4);
        code.style.height = maxBottom + 'px';
        svgL.setAttribute('width', code.style.width.replace('px', ''));
        svgL.setAttribute('height', maxBottom);
        svgL.innerHTML = noteEls.map(n => {
          const ty = n.top + n.hgt / 2;
          return `<path d="M ${n.x1} ${n.cy} C ${n.x1 + 24} ${n.cy}, ${n.nx - 24} ${ty}, ${n.nx - 2} ${ty}" stroke="${INK}" stroke-width="3" stroke-dasharray="2 7" stroke-linecap="round" fill="none"/>` +
            `<circle cx="${n.x1}" cy="${n.cy}" r="5" fill="${INK}"/>`;
        }).join('');
      });
    }
    // 작업판 폭에 맞게 줄이기(넘치면)
    const fit = h('div', { class: 'fit' }, code);
    POST.push(() => {
      const boardEl = fit.parentElement;
      const cs = getComputedStyle(boardEl);
      const avail = boardEl.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const need = parseFloat(code.style.width);
      const hh = parseFloat(code.style.height);
      const s = need > avail ? avail / need : 1;
      code.style.transformOrigin = '0 0';
      code.style.transform = `scale(${s})`;
      fit.style.height = (hh * s) + 'px';
      if (s < 1) console.log('board scaled', label, s.toFixed(3));
    });
    return h('div', { class: 'board', style }, h('div', { class: 'board-label' }, label), fit);
  }

  // 블록 하나만(꾸러미 목록용)
  function blockImg(b, scale = 1.6) {
    const r = EB.render([b], { scale, pad: 2 });
    const d = h('div', { class: 'pb' });
    d.innerHTML = r.svg;
    return d;
  }

  // ---------- 그림: 위에서 본 햄스터봇 ----------
  // (x,y) 로봇 가운데, ang: 바라보는 방향(도, 0=위쪽), grip: 'open'|'closed'|null, cup: 컵을 잡고 있는지
  function robot(x, y, ang, { grip = 'closed', cup = false, s = 1, led = false, ghost = false } = {}) {
    const op = ghost ? ' opacity=".35"' : '';
    const jaw = grip === 'open'
      ? `<path d="M-15,-24 L-20,-46" stroke="#5f6b73" stroke-width="7" stroke-linecap="round"/><path d="M15,-24 L20,-46" stroke="#5f6b73" stroke-width="7" stroke-linecap="round"/>`
      : `<path d="M-15,-24 L-11,-46" stroke="#5f6b73" stroke-width="7" stroke-linecap="round"/><path d="M15,-24 L11,-46" stroke="#5f6b73" stroke-width="7" stroke-linecap="round"/>`;
    const cupSvg = cup ? `<circle cx="0" cy="-40" r="10" fill="#ffffff" stroke="${INK}" stroke-width="3"/><rect x="-6" y="-46" width="12" height="12" rx="2" fill="#ff8fa3"/>` : '';
    const leds = led ? `<circle cx="-9" cy="-14" r="5.5" fill="#ffe14d" stroke="${INK}" stroke-width="2"/><circle cx="9" cy="-14" r="5.5" fill="#ffe14d" stroke="${INK}" stroke-width="2"/>` +
      `<path d="M-14,-24 l-10,-10 M14,-24 l10,-10" stroke="#ffcf1a" stroke-width="3" stroke-linecap="round"/>` : '';
    return `<g transform="translate(${x},${y}) rotate(${ang}) scale(${s})"${op}>
      <rect x="-28" y="-14" width="9" height="28" rx="3" fill="#3b3b3b"/><rect x="19" y="-14" width="9" height="28" rx="3" fill="#3b3b3b"/>
      ${jaw}${cupSvg}
      <rect x="-21" y="-26" width="42" height="50" rx="12" fill="#ffd9b8" stroke="${INK}" stroke-width="4"/>
      <path d="M0,-18 L8,-6 H-8 Z" fill="${INK}"/>
      ${leds}
    </g>`;
  }

  // 교차로 방향 그림(4가지)
  function crossPanel(dir) {
    const road = `<path d="M150,20 V280 M20,150 H280" stroke="#222" stroke-width="26" stroke-linecap="butt"/>`;
    let turn = '', end, label;
    const A = '#ff8a3d';
    const arrowHead = (x, y, a) => `<path d="M0,0 L-11,-8 L-11,8 Z" fill="${A}" transform="translate(${x},${y}) rotate(${a})"/>`;
    if (dir === '앞쪽') { end = robot(150, 140, 0, { s: .9 }); turn = arrowHead(150, 62, -90) + `<path d="M150,100 V70" stroke="${A}" stroke-width="7" stroke-linecap="round"/>`; label = '곧장 지나가서 멈춰요'; }
    if (dir === '왼쪽') { end = robot(150, 150, -90, { s: .9 }); turn = `<path d="M196,112 A52 52 0 0 0 112,104" stroke="${A}" stroke-width="7" fill="none" stroke-linecap="round"/>` + arrowHead(108, 108, 140); label = '왼쪽으로 돌고 멈춰요'; }
    if (dir === '오른쪽') { end = robot(150, 150, 90, { s: .9 }); turn = `<path d="M104,112 A52 52 0 0 1 188,104" stroke="${A}" stroke-width="7" fill="none" stroke-linecap="round"/>` + arrowHead(192, 108, 40); label = '오른쪽으로 돌고 멈춰요'; }
    if (dir === '뒤쪽') { end = robot(150, 150, 180, { s: .9 }); turn = `<path d="M104,128 A50 50 0 1 1 196,128" stroke="${A}" stroke-width="7" fill="none" stroke-linecap="round"/>` + arrowHead(198, 134, 100); label = '뒤로 돌고 멈춰요(유턴)'; }
    return { svg: `<svg viewBox="0 0 300 300" width="250" height="250" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="292" height="292" rx="26" fill="#fffdf8" stroke="${INK}" stroke-width="4"/>
      ${road}
      <path d="M150,250 V196" stroke="${A}" stroke-width="7" stroke-linecap="round" stroke-dasharray="2 12"/>
      ${robot(150, 262, 0, { s: .9, ghost: true })}
      ${end}
      ${turn}
    </svg>`, label };
  }

  window.D = { h, H, mascot, head, foot, board, blockImg, robot, crossPanel, INK };
})();
