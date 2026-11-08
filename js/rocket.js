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

  // 완성된 로켓 그림(조각들이 이 그림을 나눠 가짐) - 그림책처럼 파스텔 색과 굵은 갈색 테두리
  const INK = '#5a4636';
  const O = `stroke="${INK}" stroke-width="4" stroke-linejoin="round"`;
  const ART = `
    <defs>
      <radialGradient id="gGlow"><stop offset="0" stop-color="#fff6c2" stop-opacity=".95"/><stop offset="1" stop-color="#ffd6e4" stop-opacity="0"/></radialGradient>
      <g id="rocketArt">
        <path d="${FIN_L}" fill="#8fd3ff" ${O}/>
        <path d="${FIN_R}" fill="#8fd3ff" ${O}/>
        <path d="M${X0 - 40},${Z.fins.y1 - 34} L${X0 - 12},${Z.fins.y1 - 40}" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>
        <path d="M${X1 + 40},${Z.fins.y1 - 34} L${X1 + 12},${Z.fins.y1 - 40}" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>
        <path d="${NOZZLE}" fill="#c9c2d9" ${O}/>
        <path d="M${CX - 30},${Z.nozzle.y0 + 14} H${CX + 30}" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".7"/>
        ${rect('engine', `fill="#ffd27f" ${O}`)}
        ${[0, 1, 2, 3].map(i => `<circle cx="${X0 + 26 + i * 26}" cy="${mid('engine')}" r="7" fill="#fff4cf" ${O.replace('4', '3')}/>`).join('')}
        ${rect('tank1', `fill="#fffaf0" ${O}`)}
        <rect x="${X0}" y="${Z.tank1.y0 + 64}" width="${W}" height="14" fill="#ff9fb5" ${O.replace('4', '3')}/>
        <rect x="${X0}" y="${Z.tank1.y1 - 14}" width="${W}" height="10" fill="#b9ecd0" ${O.replace('4', '3')}/>
        <text x="${CX}" y="${Z.tank1.y0 + 44}" font-size="32" fill="#ff6f91" text-anchor="middle" stroke="${INK}" stroke-width="1.5" paint-order="stroke" font-family="Jua, sans-serif">경남호</text>
        <text x="${CX}" y="${Z.tank1.y0 + 99}" font-size="16" fill="${INK}" text-anchor="middle" font-family="Jua, sans-serif">★ KOREA ★</text>
        ${rect('interstage', `fill="#b9ecd0" ${O}`)}
        ${[0, 1, 2, 3, 4].map(i => `<circle cx="${X0 + 17 + i * 24}" cy="${mid('interstage')}" r="3.5" fill="${INK}"/>`).join('')}
        ${rect('engine2', `fill="#d9ccff" ${O}`)}
        <path d="M${CX - 16},${Z.engine2.y0 + 8} H${CX + 16} L${CX + 26},${Z.engine2.y1 - 6} H${CX - 26}Z" fill="#c9c2d9" ${O.replace('4', '3')}/>
        ${rect('tank2', `fill="#fffaf0" ${O}`)}
        <circle cx="${CX}" cy="${mid('tank2')}" r="34" fill="#bfe6ff" ${O}/>
        <circle cx="${CX - 12}" cy="${mid('tank2') - 4}" r="5" fill="${INK}"/><circle cx="${CX + 12}" cy="${mid('tank2') - 4}" r="5" fill="${INK}"/>
        <circle cx="${CX - 10}" cy="${mid('tank2') - 6}" r="1.8" fill="#fff"/><circle cx="${CX + 14}" cy="${mid('tank2') - 6}" r="1.8" fill="#fff"/>
        <ellipse cx="${CX - 22}" cy="${mid('tank2') + 8}" rx="6" ry="4" fill="#ffaec4"/><ellipse cx="${CX + 22}" cy="${mid('tank2') + 8}" rx="6" ry="4" fill="#ffaec4"/>
        <path d="M${CX - 7},${mid('tank2') + 8} Q${CX},${mid('tank2') + 15} ${CX + 7},${mid('tank2') + 8}" stroke="${INK}" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M${CX - 22},${mid('tank2') - 20} Q${CX - 14},${mid('tank2') - 28} ${CX - 4},${mid('tank2') - 29}" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/>
        ${rect('avionics', `fill="#ffe9a3" ${O}`)}
        ${[0, 1, 2].map(i => `<rect x="${X0 + 16 + i * 36}" y="${Z.avionics.y0 + 14}" width="26" height="${Z.avionics.y1 - Z.avionics.y0 - 28}" rx="8" fill="#fff" ${O.replace('4', '3')}/><circle cx="${X0 + 29 + i * 36}" cy="${mid('avionics')}" r="5" fill="${['#ff8fa3', '#7fd6a8', '#8fb8ff'][i]}"/>`).join('')}
        ${rect('payload', `fill="#fffaf0" ${O}`)}
        <rect x="${CX - 36}" y="${mid('payload') - 7}" width="18" height="14" rx="3" fill="#8fb8ff" ${O.replace('4', '2.5')}/>
        <rect x="${CX + 18}" y="${mid('payload') - 7}" width="18" height="14" rx="3" fill="#8fb8ff" ${O.replace('4', '2.5')}/>
        <rect x="${CX - 16}" y="${mid('payload') - 14}" width="32" height="28" rx="8" fill="#ffd27f" ${O.replace('4', '3')}/>
        <path d="M${CX},${mid('payload') - 14} V${mid('payload') - 22}" stroke="${INK}" stroke-width="3"/><circle cx="${CX}" cy="${mid('payload') - 24}" r="3.5" fill="#ff8fa3" stroke="${INK}" stroke-width="2"/>
        <path d="${NOSE}" fill="#ff9fb5" ${O}/>
        <path d="M${CX - 22},${Z.fairing.y0 + 40} C${CX - 14},${Z.fairing.y0 + 22} ${CX - 6},${Z.fairing.y0 + 14} ${CX - 1},${Z.fairing.y0 + 12}" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round" opacity=".85"/>
        <circle cx="${CX + 22}" cy="${Z.fairing.y1 - 34}" r="5" fill="#fff" opacity=".9"/><circle cx="${CX - 26}" cy="${Z.fairing.y1 - 22}" r="3.5" fill="#fff" opacity=".9"/>
      </g>
      <g id="hamBot">
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
        <rect x="-36" y="44" width="20" height="12" rx="6" fill="#8fb8ff" ${O.replace('4', '3')}/><rect x="16" y="44" width="20" height="12" rx="6" fill="#8fb8ff" ${O.replace('4', '3')}/>
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

      // 발사대와 타워(그림책 풍): 풀밭 언덕, 둥근 발사대, 파스텔 타워
      const pad = el('g', {}, svg);
      el('path', { d: `M-700,${GROUND + 40} C-300,${GROUND + 40} -100,${GROUND - 24} 210,${GROUND - 24} C520,${GROUND - 24} 720,${GROUND + 40} 1120,${GROUND + 40} V${GROUND + 400} H-700Z`, fill: '#b9ecd0', stroke: INK, 'stroke-width': 4 }, pad);
      [[30, GROUND + 30], [90, GROUND + 44], [330, GROUND + 36], [395, GROUND + 50]].forEach(([x, y]) =>
        el('path', { d: `M${x - 6},${y} q6,-12 12,0`, stroke: '#5fb88a', 'stroke-width': 3, fill: 'none', 'stroke-linecap': 'round' }, pad));
      el('rect', { x: 70, y: GROUND - 4, width: 280, height: 26, rx: 13, fill: '#e8dccb', stroke: INK, 'stroke-width': 4 }, pad);
      el('rect', { x: 350, y: 84, width: 10, height: GROUND - 84, rx: 5, fill: '#ffd27f', stroke: INK, 'stroke-width': 3 }, pad);
      el('rect', { x: 386, y: 84, width: 10, height: GROUND - 84, rx: 5, fill: '#ffd27f', stroke: INK, 'stroke-width': 3 }, pad);
      let lattice = '';
      for (let y = 100; y < GROUND - 10; y += 46) lattice += `M360,${y} H386 `;
      el('path', { d: lattice, stroke: INK, 'stroke-width': 3, 'stroke-linecap': 'round' }, pad);
      el('circle', { cx: 373, cy: 74, r: 9, fill: '#ff8fa3', stroke: INK, 'stroke-width': 3, class: 'beacon' }, pad);
      el('text', { x: 210, y: GROUND + 62, 'font-size': 22, fill: INK, 'text-anchor': 'middle', 'font-family': 'Jua, sans-serif' }, pad, '로켓 조립장');
      // 응원하는 햄찌봇(이 수업용으로 새로 그린 캐릭터)
      const bot = el('g', { class: 'hambot', transform: `translate(48 ${GROUND - 46}) scale(.62)` }, pad);
      el('use', { href: '#hamBot' }, el('g', { class: 'hambot-body' }, bot));
      this.bot = bot;

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
          // 햄찌봇이 깡충 뛰며 응원합니다
          if (this.bot) { this.bot.classList.remove('cheer'); void this.bot.getBBox(); this.bot.classList.add('cheer'); }
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
