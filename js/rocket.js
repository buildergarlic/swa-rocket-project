// 조립 화면의 로켓 그림.
// 완성된 로켓 그림을 한 장 그려 두고, 부품마다 그 그림의 한 조각(구역을 나눈 조각)만 보이게 합니다.
// 그래서 부품 수가 12개든 36개든 데이터(js/parts.js)의 zone만 정하면 알맞게 나눠 붙습니다.
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const CX = 210, W = 130, X0 = CX - W / 2, X1 = CX + W / 2, GROUND = 700;
  const FULL_VB = [0, 0, 420, 775];

  // 로켓 구역(위 → 아래). y0: 위쪽, y1: 아래쪽
  const ZONES = {
    fairing: { name: '페어링(머리 덮개)', y0: 70, y1: 190 },
    payload: { name: '인공위성 칸', y0: 190, y1: 250 },
    avionics: { name: '전자장비·유도', y0: 250, y1: 320 },
    tank2: { name: '2단 탱크', y0: 320, y1: 420 },
    engine2: { name: '2단 엔진', y0: 420, y1: 470 },
    interstage: { name: '단 연결부', y0: 470, y1: 495 },
    tank1: { name: '1단 탱크', y0: 495, y1: 605 },
    engine: { name: '엔진 계통', y0: 605, y1: 650 },
    nozzle: { name: '1단 엔진', y0: 650, y1: 700 },
    fins: { name: '날개', y0: 545, y1: 690 },
  };
  const Z = ZONES;
  // 예전 데이터의 shape 값 → 구역
  const SHAPE_ZONE = {
    nozzle: 'nozzle', shield: 'engine', pipes: 'engine', engine: 'engine', insulation: 'tank1', band: 'interstage',
    engine2: 'engine2', avionics: 'avionics', panel: 'avionics', antenna: 'avionics', payload: 'payload',
    nose: 'fairing', fins: 'fins', finL: 'fins', finR: 'fins',
  };
  const zoneOf = (p, bodyIdx) => p.zone || SHAPE_ZONE[p.shape] || (bodyIdx < 2 ? 'tank1' : 'tank2');

  const el = (tag, attrs = {}, parent, text) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  };

  const NOSE = `M${X0},${Z.fairing.y1} C${X0},${Z.fairing.y1 - 62} ${CX - 32},${Z.fairing.y0 + 18} ${CX},${Z.fairing.y0} C${CX + 32},${Z.fairing.y0 + 18} ${X1},${Z.fairing.y1 - 62} ${X1},${Z.fairing.y1}Z`;
  const FIN_L = `M${X0},${Z.fins.y0} L${X0 - 58},${Z.fins.y1 - 50} L${X0 - 58},${Z.fins.y1} L${X0},${Z.fins.y1 - 28}Z`;
  const FIN_R = `M${X1},${Z.fins.y0} L${X1 + 58},${Z.fins.y1 - 50} L${X1 + 58},${Z.fins.y1} L${X1},${Z.fins.y1 - 28}Z`;
  const NOZZLE = `M${CX - 40},${Z.nozzle.y0} H${CX + 40} L${CX + 58},${Z.nozzle.y1} H${CX - 58}Z`;
  const rect = (z, extra = '') => `<rect x="${X0}" y="${Z[z].y0}" width="${W}" height="${Z[z].y1 - Z[z].y0}" ${extra}/>`;
  const mid = z => (Z[z].y0 + Z[z].y1) / 2;

  // 완성된 로켓 그림(조각들이 이 그림을 나눠 가짐)
  const ART = `
    <defs>
      <linearGradient id="gWhite" x1="0" x2="1"><stop offset="0" stop-color="#9aa3b5"/><stop offset=".35" stop-color="#fff"/><stop offset=".6" stop-color="#f4f6fb"/><stop offset="1" stop-color="#8790a3"/></linearGradient>
      <linearGradient id="gRed" x1="0" x2="1"><stop offset="0" stop-color="#8f1d22"/><stop offset=".4" stop-color="#ff5a5f"/><stop offset="1" stop-color="#7d161b"/></linearGradient>
      <linearGradient id="gMetal" x1="0" x2="1"><stop offset="0" stop-color="#2b2e36"/><stop offset=".45" stop-color="#a3a9b5"/><stop offset="1" stop-color="#25282f"/></linearGradient>
      <linearGradient id="gNavy" x1="0" x2="1"><stop offset="0" stop-color="#0d1b33"/><stop offset=".45" stop-color="#2f5590"/><stop offset="1" stop-color="#0d1b33"/></linearGradient>
      <linearGradient id="gGray" x1="0" x2="1"><stop offset="0" stop-color="#5d6472"/><stop offset=".45" stop-color="#d9dde6"/><stop offset="1" stop-color="#555b68"/></linearGradient>
      <linearGradient id="gGold" x1="0" x2="1"><stop offset="0" stop-color="#7a4a10"/><stop offset=".45" stop-color="#ffd27a"/><stop offset="1" stop-color="#6b3f0c"/></linearGradient>
      <radialGradient id="gGlow"><stop offset="0" stop-color="#fff6c2" stop-opacity=".9"/><stop offset="1" stop-color="#ffcf3f" stop-opacity="0"/></radialGradient>
      <g id="rocketArt">
        <path d="${FIN_L}" fill="url(#gRed)" stroke="#0d1b33" stroke-width="1.5"/>
        <path d="${FIN_R}" fill="url(#gRed)" stroke="#0d1b33" stroke-width="1.5"/>
        <path d="${NOZZLE}" fill="url(#gMetal)" stroke="#0d1b33" stroke-width="1.5"/>
        <rect x="${CX - 46}" y="${Z.nozzle.y0}" width="92" height="7" fill="url(#gGold)"/>
        ${rect('engine', 'fill="#2b2f3a"')}
        ${[0, 1, 2, 3, 4].map(i => `<rect x="${X0 + 20 + i * 21}" y="${Z.engine.y0}" width="8" height="${Z.engine.y1 - Z.engine.y0}" rx="3" fill="${i % 2 ? '#c0c6d2' : '#e3a33b'}"/>`).join('')}
        <rect x="${X0 + 8}" y="${mid('engine') - 3}" width="${W - 16}" height="6" fill="#8d939f"/>
        ${rect('tank1', 'fill="url(#gWhite)" stroke="#0d1b33" stroke-width="1.5"')}
        <rect x="${X0}" y="${Z.tank1.y0 + 62}" width="${W}" height="12" fill="url(#gNavy)"/>
        <rect x="${X0}" y="${Z.tank1.y1 - 10}" width="${W}" height="8" fill="url(#gNavy)"/>
        <text x="${CX}" y="${Z.tank1.y0 + 42}" font-size="30" font-weight="900" fill="#c1121f" text-anchor="middle">경남호</text>
        <text x="${CX}" y="${Z.tank1.y0 + 96}" font-size="15" font-weight="900" fill="#1d3557" text-anchor="middle">KOREA</text>
        ${rect('interstage', 'fill="url(#gNavy)"')}
        ${[0, 1, 2, 3, 4, 5].map(i => `<circle cx="${X0 + 12 + i * 21}" cy="${mid('interstage')}" r="3" fill="#c9d3e6"/>`).join('')}
        ${rect('engine2', 'fill="url(#gGray)"')}
        <path d="M${CX - 16},${Z.engine2.y0 + 6} H${CX + 16} L${CX + 28},${Z.engine2.y1 - 4} H${CX - 28}Z" fill="url(#gMetal)"/>
        <rect x="${X0 + 10}" y="${Z.engine2.y0 + 12}" width="18" height="18" rx="4" fill="#3a3f4c"/><rect x="${X1 - 28}" y="${Z.engine2.y0 + 12}" width="18" height="18" rx="4" fill="#3a3f4c"/>
        ${rect('tank2', 'fill="url(#gWhite)" stroke="#0d1b33" stroke-width="1.5"')}
        <rect x="${X0}" y="${Z.tank2.y0 + 12}" width="${W / 2}" height="${Z.tank2.y1 - Z.tank2.y0 - 24}" fill="#1d3557" opacity=".85"/>
        <text x="${CX + 33}" y="${mid('tank2') + 6}" font-size="18" font-weight="900" fill="#1d3557" text-anchor="middle">GN-1</text>
        ${rect('avionics', 'fill="url(#gGray)"')}
        ${[0, 1, 2, 3].map(i => `<rect x="${X0 + 14 + i * 27}" y="${Z.avionics.y0 + 10}" width="20" height="${Z.avionics.y1 - Z.avionics.y0 - 20}" rx="3" fill="#1f2a3a"/><circle cx="${X0 + 24 + i * 27}" cy="${Z.avionics.y0 + 18}" r="3" fill="${i % 2 ? '#3ddc84' : '#ffcf3f'}"/>`).join('')}
        ${rect('payload', 'fill="url(#gWhite)" stroke="#0d1b33" stroke-width="1.5"')}
        <circle cx="${CX}" cy="${mid('payload')}" r="21" fill="#0d2b55" stroke="#9fb4d9" stroke-width="4"/>
        <rect x="${CX - 5}" y="${mid('payload') - 5}" width="10" height="10" fill="#ffcf3f"/>
        <rect x="${CX - 18}" y="${mid('payload') - 3}" width="11" height="6" fill="#5fa8ff"/><rect x="${CX + 7}" y="${mid('payload') - 3}" width="11" height="6" fill="#5fa8ff"/>
        <path d="${NOSE}" fill="url(#gRed)" stroke="#0d1b33" stroke-width="1.5"/>
        <path d="M${CX - 20},${Z.fairing.y0 + 30} C${CX - 12},${Z.fairing.y0 + 12} ${CX - 4},${Z.fairing.y0 + 6} ${CX},${Z.fairing.y0 + 4}" stroke="#fff8" stroke-width="5" fill="none" stroke-linecap="round"/>
      </g>
    </defs>`;

  // 구역의 윤곽선(빈자리 점선)
  function zoneOutline(z) {
    const Z = ZONES[z];
    if (z === 'fairing') return NOSE;
    if (z === 'nozzle') return NOZZLE;
    if (z === 'fins') return `${FIN_L} ${FIN_R}`;
    return `M${X0},${Z.y0} H${X1} V${Z.y1} H${X0}Z`;
  }
  function zoneBox(z) {
    const Z = ZONES[z];
    if (z === 'nozzle') return { x: CX - 58, y: Z.y0, w: 116, h: Z.y1 - Z.y0 };
    return { x: X0, y: Z.y0, w: W, h: Z.y1 - Z.y0 };
  }

  // 한 구역을 k개 조각으로 나누기 → [{x,y,w,h}] (날개는 왼쪽/오른쪽 따로)
  function tiles(z, k) {
    if (z === 'fins') {
      const fy = Z.fins.y0 - 2, fh = Z.fins.y1 - Z.fins.y0 + 4;
      const L = { x: X0 - 60, y: fy, w: 60, h: fh }, Rr = { x: X1, y: fy, w: 60, h: fh };
      if (k === 1) return [{ x: X0 - 60, y: fy, w: W + 120, h: fh, fins: true }];
      const per = [Math.ceil(k / 2), Math.floor(k / 2)];
      const out = [];
      [L, Rr].forEach((b, s) => { for (let i = 0; i < per[s]; i++) out.push({ x: b.x, y: b.y + (b.h / per[s]) * i, w: b.w, h: b.h / per[s] }); });
      return out;
    }
    const b = zoneBox(z);
    const cols = Math.min(k, b.h < 45 ? 4 : 3);
    const rows = Math.ceil(k / cols);
    const out = [];
    for (let r = 0; r < rows; r++) {
      const n = r === rows - 1 ? k - cols * (rows - 1) : cols;
      for (let c = 0; c < n; c++) out.push({ x: b.x + (b.w / n) * c, y: b.y + (b.h / rows) * r, w: b.w / n, h: b.h / rows });
    }
    return out;
  }

  const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  const RocketView = {
    build(svg, parts) {
      this.svg = svg;
      this.vb = [...FULL_VB];
      svg.setAttribute('viewBox', this.vb.join(' '));
      svg.innerHTML = ART;
      const defs = svg.querySelector('defs');

      // 발사대와 타워
      const pad = el('g', {}, svg);
      el('rect', { x: 40, y: GROUND, width: 340, height: 26, fill: '#5b606c', rx: 4 }, pad);
      el('rect', { x: 0, y: GROUND + 26, width: 420, height: 50, fill: '#23262f' }, pad);
      el('rect', { x: 352, y: 80, width: 8, height: GROUND - 80, fill: '#3a3f4c' }, pad);
      el('rect', { x: 384, y: 80, width: 8, height: GROUND - 80, fill: '#3a3f4c' }, pad);
      let lattice = '';
      for (let y = 80; y < GROUND; y += 40) lattice += `M356,${y} L388,${y + 40} M388,${y} L356,${y + 40} `;
      el('path', { d: lattice, stroke: '#3a3f4c', 'stroke-width': 3 }, pad);
      el('circle', { cx: 372, cy: 70, r: 7, fill: '#ff3b3b' }, pad);
      el('text', { x: 210, y: GROUND + 56, 'font-size': 20, 'font-weight': 700, fill: '#a9b6e0', 'text-anchor': 'middle' }, pad, '🛰️ 로켓 조립장');

      // 부품을 구역별로 묶기
      const byZone = {};
      let bodyIdx = 0;
      parts.forEach(p => {
        const z = zoneOf(p, p.shape === 'body' ? bodyIdx++ : 0);
        (byZone[z] = byZone[z] || []).push(p);
      });
      this.slots = {};
      for (const z in byZone) tiles(z, byZone[z].length).forEach((t, i) => { this.slots[byZone[z][i].no] = { ...t, zone: z }; });

      const glow = el('ellipse', { cx: CX, cy: 400, rx: 190, ry: 360, fill: 'url(#gGlow)', class: 'rocket-glow' }, svg);
      this.glow = glow;
      const ghosts = el('g', { class: 'ghosts' }, svg);
      const base = el('g', {}, svg);
      const pieces = el('g', {}, svg);
      const labels = el('g', { class: 'ghost-labels' }, svg);

      // 부품이 없는 구역은 처음부터 있는 기본 구조로 그립니다(인공위성 칸은 마지막에 실음).
      this.payloadBase = null;
      for (const z in ZONES) {
        el('path', { d: zoneOutline(z), class: 'ghost' }, ghosts);
        if (byZone[z]) continue;
        const id = `cz-${z}`;
        const cp = el('clipPath', { id }, defs);
        el('path', { d: zoneOutline(z) }, cp);
        const g = el('g', { 'clip-path': `url(#${id})`, class: z === 'payload' ? 'base payload-base' : 'base' }, base);
        el('use', { href: '#rocketArt' }, g);
        if (z === 'payload') this.payloadBase = g;
      }

      this.pieces = {};
      // 날개 조각을 먼저 그려 몸통 뒤로 가게 합니다.
      const order = [...parts].sort((a, b) => (this.slots[b.no].zone === 'fins') - (this.slots[a.no].zone === 'fins'));
      order.forEach(p => {
        const t = this.slots[p.no];
        const id = `cp-${p.no}`;
        const cp = el('clipPath', { id }, defs);
        if (t.zone === 'fins' && !t.fins) el('rect', { x: t.x, y: t.y, width: t.w, height: t.h }, cp);
        else {
          // 구역 모양 안에서 조각 사각형만
          const inner = el('clipPath', { id: `${id}-z` }, defs);
          el('path', { d: zoneOutline(t.zone) }, inner);
          el('rect', { x: t.x, y: t.y, width: t.w, height: t.h, 'clip-path': `url(#${id}-z)` }, cp);
        }
        // 조각 경계 점선
        el('rect', { x: t.x, y: t.y, width: t.w, height: t.h, class: 'ghost-tile', 'clip-path': `url(#${id})` }, ghosts);
        const cx = t.x + t.w / 2, cy = t.y + t.h / 2;
        t.cx = cx; t.cy = cy;
        el('text', { x: cx, y: cy, class: 'ghost-num', 'font-size': Math.min(22, t.h * 0.5, t.w * 0.45) }, labels, p.no);

        const g = el('g', { class: 'piece', 'clip-path': `url(#${id})` }, pieces);
        const ang = Math.random() * Math.PI * 2;
        g.style.setProperty('--fx', `${Math.cos(ang) * 700}px`);
        g.style.setProperty('--fy', `${-200 - Math.random() * 500}px`);
        g.style.setProperty('--fr', `${(Math.random() - 0.5) * 90}deg`);
        g.style.transformOrigin = `${cx}px ${cy}px`;
        el('use', { href: '#rocketArt' }, g);
        // 막 도착한 조각을 강조하는 테두리
        el('rect', { x: t.x + 1, y: t.y + 1, width: t.w - 2, height: t.h - 2, class: 'piece-hl' }, g);
        this.pieces[p.no] = g;
        p._label = labels.lastChild;
      });
      this.labels = Object.fromEntries(parts.map(p => [p.no, p._label]));
    },

    set(arrived, animateNo, complete) {
      if (animateNo == null) this.svg.classList.add('noanim');
      for (const no in this.pieces) {
        const on = !!arrived[no];
        this.pieces[no].classList.toggle('on', on);
        this.labels[no].style.display = on ? 'none' : '';
        if (+no === animateNo && on) {
          const g = this.pieces[no];
          g.classList.remove('flash');
          void g.getBBox();
          g.classList.add('flash');
        }
      }
      this.svg.classList.toggle('complete', !!complete);
      if (this.payloadBase) this.payloadBase.classList.toggle('on', !!complete);
      if (animateNo == null) requestAnimationFrame(() => requestAnimationFrame(() => this.svg.classList.remove('noanim')));
    },

    slot(no) { return this.slots[no]; },
    zoneName(no) { return ZONES[this.slots[no]?.zone]?.name || ''; },

    // viewBox를 부드럽게 옮겨 화면을 확대/축소합니다.
    tweenTo(vb, ms = 650) {
      cancelAnimationFrame(this.tw);
      const from = [...this.vb];
      const t0 = performance.now();
      return new Promise(res => {
        const step = now => {
          const k = ease(Math.min(1, (now - t0) / ms));
          this.vb = from.map((v, i) => v + (vb[i] - v) * k);
          this.svg.setAttribute('viewBox', this.vb.join(' '));
          if (k < 1) this.tw = requestAnimationFrame(step); else res();
        };
        this.tw = requestAnimationFrame(step);
      });
    },
    // 그 부품을 중심으로 확대(조립 장면을 크게 보여 줌)
    focus(no) {
      const t = this.slots[no];
      if (!t) return Promise.resolve();
      const h = 300, w = h * (FULL_VB[2] / FULL_VB[3]) * 1.6;
      return this.tweenTo([t.cx - w / 2, t.cy - h / 2, w, h], 600);
    },
    reset(ms) { return this.tweenTo([...FULL_VB], ms); },
  };

  window.RocketView = RocketView;
})();
