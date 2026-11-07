// 조립 화면의 로켓 그림: 부품마다 점선 자리(빈칸)와 실제 부품을 그립니다.
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const CX = 210, W = 130, GROUND = 700;
  const HEIGHTS = { nozzle: 48, body: 100, band: 22, engine2: 34, avionics: 46, payload: 58, nose: 122 };
  const STACK = Object.keys(HEIGHTS);

  const el = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };

  const DEFS = `
    <linearGradient id="gWhite" x1="0" x2="1"><stop offset="0" stop-color="#9aa3b5"/><stop offset=".35" stop-color="#fff"/><stop offset=".6" stop-color="#f4f6fb"/><stop offset="1" stop-color="#8790a3"/></linearGradient>
    <linearGradient id="gRed" x1="0" x2="1"><stop offset="0" stop-color="#8f1d22"/><stop offset=".4" stop-color="#ff5a5f"/><stop offset="1" stop-color="#7d161b"/></linearGradient>
    <linearGradient id="gMetal" x1="0" x2="1"><stop offset="0" stop-color="#2b2e36"/><stop offset=".45" stop-color="#a3a9b5"/><stop offset="1" stop-color="#25282f"/></linearGradient>
    <linearGradient id="gNavy" x1="0" x2="1"><stop offset="0" stop-color="#0d1b33"/><stop offset=".45" stop-color="#2f5590"/><stop offset="1" stop-color="#0d1b33"/></linearGradient>
    <linearGradient id="gGray" x1="0" x2="1"><stop offset="0" stop-color="#5d6472"/><stop offset=".45" stop-color="#d9dde6"/><stop offset="1" stop-color="#555b68"/></linearGradient>`;

  // 부품마다 [윤곽선, 그림 그리기 함수]를 만듭니다.
  function layout(parts) {
    let y = GROUND;
    const slots = {};
    let firstBody = null, avionics = null, payload = null, bodyCount = 0;
    parts.forEach(p => {
      if (!STACK.includes(p.shape)) return;
      const h = HEIGHTS[p.shape];
      slots[p.no] = { y0: y, y1: y - h, h };
      if (p.shape === 'body') { bodyCount++; slots[p.no].idx = bodyCount; if (!firstBody) firstBody = slots[p.no]; }
      if (p.shape === 'avionics') avionics = slots[p.no];
      if (p.shape === 'payload') payload = slots[p.no];
      y -= h;
    });
    const top = y;
    parts.forEach(p => {
      const base = firstBody || { y0: GROUND - 48, y1: GROUND - 148 };
      if (p.shape === 'finL' || p.shape === 'finR') slots[p.no] = { base, side: p.shape === 'finL' ? -1 : 1 };
      if (p.shape === 'antenna') slots[p.no] = { base: avionics || payload || base };
    });
    return { slots, top };
  }

  function outline(p, s) {
    const x0 = CX - W / 2, x1 = CX + W / 2;
    switch (p.shape) {
      case 'nozzle': return `M${CX - 36},${s.y1} L${CX + 36},${s.y1} L${CX + 56},${s.y0} L${CX - 56},${s.y0}Z`;
      case 'nose': return `M${x0},${s.y0} C${x0},${s.y0 - 60} ${CX - 32},${s.y1 + 18} ${CX},${s.y1} C${CX + 32},${s.y1 + 18} ${x1},${s.y0 - 60} ${x1},${s.y0}Z`;
      case 'band': return `M${x0 - 3},${s.y1} H${x1 + 3} V${s.y0} H${x0 - 3}Z`;
      case 'finL': case 'finR': {
        const d = s.side, bx = CX + d * W / 2, b = s.base;
        return `M${bx},${b.y1 + 8} L${bx + d * 62},${b.y0 + 4} L${bx + d * 62},${b.y0 + 44} L${bx},${b.y0 + 8}Z`;
      }
      case 'antenna': {
        const b = s.base, ym = (b.y0 + b.y1) / 2;
        return `M${x0},${ym + 4} L${x0 - 50},${ym - 46} L${x0 - 44},${ym - 52} L${x0},${ym - 8}Z M${x1},${ym + 4} L${x1 + 50},${ym - 46} L${x1 + 44},${ym - 52} L${x1},${ym - 8}Z`;
      }
      default: return `M${x0},${s.y1} H${x1} V${s.y0} H${x0}Z`;
    }
  }

  function center(p, s) {
    if (p.shape === 'finL' || p.shape === 'finR') return [CX + s.side * (W / 2 + 34), s.base.y0 + 18];
    if (p.shape === 'antenna') { const ym = (s.base.y0 + s.base.y1) / 2; return [CX - W / 2 - 34, ym - 30]; }
    if (p.shape === 'nose') return [CX, s.y0 - 46];
    return [CX, (s.y0 + s.y1) / 2];
  }

  function drawPiece(g, p, s) {
    const x0 = CX - W / 2;
    const d = outline(p, s);
    const fill = { nozzle: 'url(#gMetal)', nose: 'url(#gRed)', finL: 'url(#gRed)', finR: 'url(#gRed)', band: 'url(#gNavy)', engine2: 'url(#gGray)', avionics: 'url(#gGray)', antenna: 'url(#gGray)' }[p.shape] || 'url(#gWhite)';
    el('path', { d, fill, stroke: '#0d1b33', 'stroke-width': 1.5 }, g);
    if (p.shape === 'body') {
      // 탱크마다 무늬를 다르게
      if (s.idx % 2 === 1) el('rect', { x: x0, y: s.y1 + s.h * 0.42, width: W, height: 14, fill: 'url(#gNavy)' }, g);
      else { el('rect', { x: x0, y: s.y1 + 6, width: W / 2, height: s.h - 12, fill: '#1d3557', opacity: 0.85 }, g); }
      if (s.idx === 2) {
        const t = el('text', { x: CX + W / 4, y: (s.y0 + s.y1) / 2, 'font-size': 20, 'font-weight': 900, fill: '#1d3557', 'text-anchor': 'middle', 'dominant-baseline': 'middle', transform: `rotate(-90 ${CX + W / 4} ${(s.y0 + s.y1) / 2})` }, g);
        t.textContent = 'KOREA';
      }
      if (s.idx === 3) {
        const t = el('text', { x: CX, y: s.y1 + s.h * 0.24, 'font-size': 26, 'font-weight': 900, fill: '#c1121f', 'text-anchor': 'middle', 'dominant-baseline': 'middle' }, g);
        t.textContent = '경남호';
      }
    }
    if (p.shape === 'band') for (let i = 0; i < 6; i++) el('circle', { cx: x0 + 12 + i * 21, cy: (s.y0 + s.y1) / 2, r: 3, fill: '#c9d3e6' }, g);
    if (p.shape === 'engine2') el('path', { d: `M${CX - 14},${s.y1 + 6} H${CX + 14} L${CX + 24},${s.y0 - 3} H${CX - 24}Z`, fill: 'url(#gMetal)' }, g);
    if (p.shape === 'avionics') for (let i = 0; i < 4; i++) {
      el('rect', { x: x0 + 14 + i * 27, y: s.y1 + 10, width: 20, height: s.h - 20, rx: 3, fill: '#1f2a3a' }, g);
      el('circle', { cx: x0 + 24 + i * 27, cy: s.y1 + 18, r: 3, fill: i % 2 ? '#3ddc84' : '#ffcf3f' }, g);
    }
    if (p.shape === 'payload') {
      const cy = (s.y0 + s.y1) / 2;
      el('circle', { cx: CX, cy, r: 22, fill: '#0d2b55', stroke: '#9fb4d9', 'stroke-width': 4 }, g);
      el('rect', { x: CX - 6, y: cy - 6, width: 12, height: 12, fill: '#ffcf3f' }, g);
      el('rect', { x: CX - 19, y: cy - 4, width: 11, height: 8, fill: '#5fa8ff' }, g);
      el('rect', { x: CX + 8, y: cy - 4, width: 11, height: 8, fill: '#5fa8ff' }, g);
    }
    if (p.shape === 'antenna') {
      const ym = (s.base.y0 + s.base.y1) / 2;
      el('circle', { cx: x0 - 50, cy: ym - 50, r: 8, fill: '#ff5a5f' }, g);
      el('circle', { cx: x0 + W + 50, cy: ym - 50, r: 8, fill: '#ff5a5f' }, g);
    }
    if (p.shape === 'nose') el('path', { d: `M${CX - 20},${s.y1 + 30} C${CX - 12},${s.y1 + 12} ${CX - 4},${s.y1 + 6} ${CX},${s.y1 + 4}`, stroke: '#fff8', 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }, g);
  }

  const RocketView = {
    build(svg, parts) {
      this.svg = svg;
      svg.innerHTML = `<defs>${DEFS}</defs>`;
      const { slots } = layout(parts);
      // 발사대와 타워
      const pad = el('g', {}, svg);
      el('rect', { x: 40, y: GROUND, width: 340, height: 26, fill: '#5b606c', rx: 4 }, pad);
      el('rect', { x: 0, y: GROUND + 26, width: 420, height: 40, fill: '#23262f' }, pad);
      el('rect', { x: 352, y: 80, width: 8, height: GROUND - 80, fill: '#3a3f4c' }, pad);
      el('rect', { x: 384, y: 80, width: 8, height: GROUND - 80, fill: '#3a3f4c' }, pad);
      let lattice = '';
      for (let y = 80; y < GROUND; y += 40) lattice += `M356,${y} L388,${y + 40} M388,${y} L356,${y + 40} `;
      el('path', { d: lattice, stroke: '#3a3f4c', 'stroke-width': 3 }, pad);
      el('circle', { cx: 372, cy: 70, r: 7, fill: '#ff3b3b' }, pad);
      const label = el('text', { x: 210, y: GROUND + 54, 'font-size': 20, 'font-weight': 700, fill: '#a9b6e0', 'text-anchor': 'middle' }, pad);
      label.textContent = '🛰️ 로켓 발사대';

      const ghosts = el('g', {}, svg);
      const pieces = el('g', {}, svg);
      this.pieces = {};
      // 날개·안테나가 몸통 뒤로 가도록 먼저 그립니다.
      const order = [...parts].sort((a, b) => (['finL', 'finR', 'antenna'].includes(b.shape) ? 1 : 0) - (['finL', 'finR', 'antenna'].includes(a.shape) ? 1 : 0));
      order.forEach(p => {
        const s = slots[p.no];
        if (!s) return;
        el('path', { d: outline(p, s), class: 'ghost' }, ghosts);
        const [tx, ty] = center(p, s);
        const n = el('text', { x: tx, y: ty, class: 'ghost-num' }, ghosts);
        n.textContent = p.no;
        const g = el('g', { class: 'piece' }, pieces);
        const ang = Math.random() * Math.PI * 2;
        g.style.setProperty('--fx', `${Math.cos(ang) * 600}px`);
        g.style.setProperty('--fy', `${-300 - Math.random() * 400}px`);
        g.style.setProperty('--fr', `${(Math.random() - 0.5) * 120}deg`);
        drawPiece(g, p, s);
        this.pieces[p.no] = g;
      });
    },

    set(arrived, animateNo) {
      if (animateNo == null) this.svg.classList.add('noanim');
      for (const no in this.pieces) {
        const g = this.pieces[no];
        g.classList.toggle('on', !!arrived[no]);
        if (+no === animateNo && arrived[no]) {
          g.classList.remove('flash');
          void g.getBBox();
          g.classList.add('flash');
        }
      }
      if (animateNo == null) requestAnimationFrame(() => requestAnimationFrame(() => this.svg.classList.remove('noanim')));
    },
  };

  window.RocketView = RocketView;
})();
