// 경남 지도 화면: 실제 시군 경계 위에 전지 6장 구역, 부품 업체, 발사대를 표시합니다.
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs = {}, parent, text) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  };
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const PALETTE = ['#f6e3b4', '#d8efc4', '#cfe8f3', '#f3d6e4', '#e2dbf5', '#fbe0c8', '#d4f0e6', '#f5f0c2', '#dfe7f7'];

  function parsePath(d) {
    return d.split('Z').filter(Boolean).map(s => s.replace('M', '').trim().split(' ').map(p => p.split(',').map(Number)));
  }

  const MapView = {
    init(svg, panel, nav, data, geo, api) {
      Object.assign(this, { svg, panel, nav, data, geo, api, sheet: null });
      const g = data.grid;
      const W = geo.width, H = geo.height;
      this.scale = Math.min((g.cols * g.sheetW) / W, (g.rows * g.sheetH) / H); // mm/km
      this.cw = g.sheetW / this.scale;
      this.ch = g.sheetH / this.scale;
      this.ox = (g.cols * this.cw - W) / 2;
      this.oy = (g.rows * this.ch - H) / 2;
      this.regions = geo.regions.map((r, i) => ({ ...r, rings: parsePath(r.d), color: PALETTE[i % PALETTE.length] }));
      this.regionMap = Object.fromEntries(this.regions.map(r => [r.name, r]));
      this.markers = data.parts.map(p => ({ ...p, ...this.pos(p) }));
      // 실제 발사장 위치(real)와, 전지 지도 위에 그리는 자리(anchor)를 따로 둡니다.
      const LS = data.launchSite;
      this.launchReal = this.pos(LS);
      this.launch = { ...LS, ...(LS.mapLat != null ? this.pos({ lat: LS.mapLat, lon: LS.mapLon }) : this.launchReal) };
      this.sheetInfo = data.sheets.map((s, i) => ({ ...s, ...this.cell(i), regions: [] }));
      // 장마다 들어가는 시군(경계 점의 4% 이상이 그 장 안에 있으면 포함)
      for (const r of this.regions) {
        const pts = r.rings.flat();
        this.sheetInfo.forEach(si => {
          const inside = pts.filter(([x, y]) => x >= si.x && x < si.x + si.w && y >= si.y && y < si.y + si.h);
          if (inside.length / pts.length > 0.04 || this.inCell(r, si)) {
            const mx = inside.reduce((a, p) => a + p[0], 0) / (inside.length || 1);
            const my = inside.reduce((a, p) => a + p[1], 0) / (inside.length || 1);
            si.regions.push({ name: r.name, label: this.inCell(r, si) ? [r.x, r.y] : [(mx + r.x) / 2, (my + r.y) / 2], main: this.inCell(r, si) });
          }
        });
      }
      this.markers.forEach(m => { m.sheet = this.sheetOf(m.x, m.y); });
      this.launch.sheet = this.sheetOf(this.launch.x, this.launch.y);
      // 실제 발사장이 전지 6장 밖(예: 전남 고흥)에 있는지
      const gw = this.cw * data.grid.cols, gh = this.ch * data.grid.rows;
      const out = pt => pt.x < -this.ox || pt.x > gw - this.ox || pt.y < -this.oy || pt.y > gh - this.oy;
      this.launch.outside = out(this.launchReal);
      if (out(this.launch)) this.launch.sheet = null;

      nav.querySelector('#prevSheet').onclick = () => this.show(((this.sheet ?? 1) + 4) % 6 + 1);
      nav.querySelector('#nextSheet').onclick = () => this.show((this.sheet ?? 0) % 6 + 1);
      nav.querySelector('#allSheets').onclick = () => this.show(null);
    },

    pos(o) {
      const p = this.geo.proj;
      if (o.lon != null && o.lat != null) {
        return { x: (o.lon - p.lon0) * p.k * 111.32 - p.minx, y: -(o.lat - p.lat0) * 110.57 - p.miny };
      }
      const r = this.regionMap?.[o.region] || this.geo.regions.find(r => r.name === o.region);
      return r ? { x: r.x + 2, y: r.y - 5 } : { x: this.geo.width / 2, y: this.geo.height / 2 };
    },
    cell(i) {
      const c = i % this.data.grid.cols, r = Math.floor(i / this.data.grid.cols);
      return { x: c * this.cw - this.ox, y: r * this.ch - this.oy, w: this.cw, h: this.ch };
    },
    inCell(r, si) { return r.x >= si.x && r.x < si.x + si.w && r.y >= si.y && r.y < si.y + si.h; },
    sheetOf(x, y) {
      const c = Math.floor((x + this.ox) / this.cw), r = Math.floor((y + this.oy) / this.ch);
      return r * this.data.grid.cols + c + 1;
    },

    // 시군 이름이 업체·발사대 표시와 겹치면 조금 아래로 내립니다.
    labelPos(x, y) {
      const pts = [...this.markers, this.launch];
      for (const m of pts) if (Math.abs(m.x - x) < 6 && Math.abs(m.y - y) < 3.5) return [x, m.y + 6];
      return [x, y];
    },

    show(sheet) {
      this.sheet = sheet;
      this.render();
    },

    render() {
      const { svg, data } = this;
      const st = this.api.state();
      const sheet = this.sheet;
      const si = sheet ? this.sheetInfo[sheet - 1] : null;
      const pad = sheet ? 0 : 4;
      let vb = si ? [si.x, si.y, si.w, si.h] : [-this.ox - pad, -this.oy - pad, this.cw * data.grid.cols + pad * 2, this.ch * data.grid.rows + pad * 2];
      if (!si && this.launch.outside) {
        // 지도 밖 실제 발사장까지 보이도록 넓힙니다
        const R = this.launchReal;
        const x0 = Math.min(vb[0], R.x - 30), y0 = Math.min(vb[1], R.y - 14);
        const x1 = Math.max(vb[0] + vb[2], R.x + 30), y1 = Math.max(vb[1] + vb[3], R.y + 10);
        vb = [x0, y0, x1 - x0, y1 - y0];
      }
      svg.setAttribute('viewBox', vb.join(' '));
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svg.innerHTML = '';
      const k = sheet ? 0.55 : 1; // 글자 크기 비율
      const all = el('g', {}, svg);
      // 바다
      el('rect', { x: vb[0] - 50, y: vb[1] - 50, width: vb[2] + 100, height: vb[3] + 100, fill: '#9fcbe8' }, all);
      for (const n of this.geo.neighbors || []) {
        el('path', { d: n.d, class: 'neighbor' }, all);
        el('text', { x: n.x, y: n.y + 7, 'font-size': 2.6 * k + (sheet ? 0.6 : 0), fill: '#e6e8ee', 'text-anchor': 'middle', 'font-weight': 700 }, all, `${n.name} (경남 아님)`);
      }
      for (const r of this.regions) {
        el('path', { d: r.d, class: 'region', fill: r.color, 'stroke-width': sheet ? 0.3 : 0.35 }, all);
      }
      // 10cm 칸 (전지에 옮겨 그리기 쉽게)
      if (si) {
        const step = data.grid.gridMm / this.scale;
        const lines = el('g', { class: 'grid10', 'stroke-width': 0.06 }, all);
        for (let i = 1; i * step < si.w; i++) el('line', { x1: si.x + i * step, y1: si.y, x2: si.x + i * step, y2: si.y + si.h }, lines);
        for (let i = 1; i * step < si.h; i++) el('line', { x1: si.x, y1: si.y + i * step, x2: si.x + si.w, y2: si.y + i * step }, lines);
        for (let i = 0; i * step < si.w; i++) for (let j = 0; j * step < si.h; j++) {
          if (i % 2 || j % 2) continue;
          el('text', { x: si.x + i * step + 0.3, y: si.y + j * step + 1.1, 'font-size': 0.9, fill: '#1b234099' }, all, `${String.fromCharCode(65 + i)}${j + 1}`);
        }
      }
      // 시군 이름과 대표 그림
      const labels = el('g', {}, svg);
      if (si) {
        for (const r of si.regions) {
          const [x, y] = this.labelPos(...r.label);
          el('text', { x, y, class: 'region-label', 'font-size': r.main ? 2.6 : 1.9, 'stroke-width': 0.4, opacity: r.main ? 1 : 0.75 }, labels, r.name);
          if (r.main) (data.landmarks[r.name] || []).forEach((lm, i) => {
            el('text', { x, y: y + 2.4 + i * 1.9, 'font-size': 1.5, 'text-anchor': 'middle', fill: '#1b2340', 'font-weight': 700, 'paint-order': 'stroke', stroke: '#ffffffaa', 'stroke-width': 0.3 }, labels, lm);
          });
        }
      } else {
        for (const r of this.regions) { const [x, y] = this.labelPos(r.x, r.y); el('text', { x, y: y + 1, class: 'region-label', 'font-size': 3.1, 'stroke-width': 0.6 }, labels, r.name.replace(/(시|군)$/, '')); }
      }
      // 맡은 장 바깥은 어둡게 가립니다.
      if (si) {
        const B = 400;
        el('path', { d: `M${si.x - B},${si.y - B} h${si.w + 2 * B} v${si.h + 2 * B} h${-si.w - 2 * B}Z M${si.x},${si.y} v${si.h} h${si.w} v${-si.h}Z`, fill: '#0b1430', opacity: 0.72, 'fill-rule': 'evenodd' }, svg);
      }
      // 전지 구역선
      const grid = el('g', {}, svg);
      this.sheetInfo.forEach((s, i) => {
        el('rect', { x: s.x, y: s.y, width: s.w, height: s.h, class: 'sheet-line', 'stroke-width': sheet ? 0.5 : 0.6 }, grid);
        if (!sheet) {
          el('text', { x: s.x + 5, y: s.y + 9, class: 'sheet-num', 'font-size': 9, 'stroke-width': 1.2, 'text-anchor': 'start' }, grid, `${s.no}`);
          el('text', { x: s.x + 12, y: s.y + 8, 'font-size': 3.2, fill: '#ffcf3f', stroke: '#0e2a52', 'stroke-width': 0.7, 'paint-order': 'stroke', 'font-weight': 900 }, grid, s.name);
          const hit = el('rect', { x: s.x, y: s.y, width: s.w, height: s.h, class: 'sheet-hit' }, grid);
          hit.addEventListener('click', () => this.show(s.no));
        }
      });
      svg.appendChild(labels);
      // 발사대
      const L = this.launch;
      const lg = el('g', {}, svg);
      if (this.launch.outside && (L.x !== this.launchReal.x || L.y !== this.launchReal.y)) {
        // 실제 발사장(지도 밖)과 지도 위 발사대 자리를 점선으로 잇습니다
        const Rl = this.launchReal;
        el('line', { x1: L.x, y1: L.y, x2: Rl.x, y2: Rl.y, stroke: '#ff5a5f', 'stroke-width': sheet ? 0.4 : 0.6, 'stroke-dasharray': '1.5 1' }, lg);
        if (!sheet) {
          el('circle', { cx: Rl.x, cy: Rl.y, r: 2.6, fill: '#ff5a5f', stroke: '#fff', 'stroke-width': 0.4 }, lg);
          el('text', { x: Rl.x, y: Rl.y + 6, 'font-size': 2.4, 'text-anchor': 'middle', 'font-weight': 900, fill: '#fff', stroke: '#7a0010', 'stroke-width': 0.5, 'paint-order': 'stroke' }, lg, `실제 발사장: ${data.launchSite.place || ''}`);
        }
      }
      const lr = sheet ? 2.4 : 3.2;
      el('circle', { cx: L.x, cy: L.y, r: lr, fill: '#ff5a5f', stroke: '#fff', 'stroke-width': 0.5 }, lg);
      el('text', { x: L.x, y: L.y + 0.2, 'font-size': lr * 1.2, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, lg, '🚀');
      el('text', { x: L.x, y: L.y - lr - 0.8, 'font-size': 2.4 * k + 0.6, 'text-anchor': 'middle', 'font-weight': 900, fill: '#c1121f', stroke: '#fff', 'stroke-width': 0.5, 'paint-order': 'stroke' }, lg, data.launchSite.name);
      // 부품 업체
      const mk = el('g', {}, svg);
      const mr = sheet ? 1.7 : 2.4;
      for (const m of this.markers) {
        const done = !!st.arrived[m.no];
        const g = el('g', { class: 'marker' }, mk);
        el('circle', { cx: m.x, cy: m.y, r: mr, fill: done ? '#3ddc84' : '#ffcf3f', 'stroke-width': 0.4 }, g);
        el('text', { x: m.x, y: m.y, 'font-size': mr * 1.1 }, g, done ? '✓' : m.no);
        if (sheet) {
          const label = st.teacher && m.company ? `⭐ ${m.no}. ${m.name} · ${m.company}` : `⭐ ${m.no}. ${m.name} 업체 ?`;
          el('text', { x: m.x, y: m.y - mr - 0.8, 'font-size': 1.4, 'text-anchor': 'middle', 'font-weight': 900, fill: '#7a2e00', stroke: '#fff', 'stroke-width': 0.35, 'paint-order': 'stroke' }, g, label);
        }
      }
      this.nav.hidden = !sheet;
      this.renderPanel(st);
    },

    renderPanel(st) {
      const { data } = this;
      const sheet = this.sheet;
      const answer = m => {
        if (!st.teacher) return '';
        if (!m.company) return `<div class="answer">📌 업체와 근거 자료가 아직 입력되지 않았어요</div>`;
        const ev = m.evidence || {};
        const srcs = (ev.sources || (ev.url ? [{ name: ev.source || ev.url, url: ev.url }] : []))
          .map(x => `<br>📎 <a href="${esc(x.url)}" target="_blank" rel="noopener">${esc(x.name || x.url)}</a>`).join('');
        return `<div class="answer"><b>🏢 ${esc(m.company)}</b>${m.type ? ` <span class="muted">· ${esc(m.type)}</span>` : ''}${m.place ? `<br>📍 ${esc(m.place)}` : ''}${m.hint ? `<br>💡 힌트: ${esc(m.hint)}` : ''}${ev.summary ? `<br>${esc(ev.summary)}` : ''}${srcs}</div>`;
      };
      const mission = m => `<li class="mission ${st.arrived[m.no] ? 'done' : ''}"><span class="badge">${st.arrived[m.no] ? '✓' : m.no}</span>
        <div><b>${esc(m.name)}</b> · ${esc(m.region)} <span class="muted">(${m.sheet}번 장)</span>${m.kidRole ? `<br>${esc(m.kidRole)}` : ''}<br><span class="muted">🔎 ${esc(m.question)}</span>${answer(m)}</div></li>`;

      if (!sheet) {
        this.panel.innerHTML = `
          <h2>🗺️ 경상남도 지도</h2>
          <p class="muted">전지 ${data.grid.cols * data.grid.rows}장(세로 ${data.grid.sheetW}×${data.grid.sheetH}mm)을 가로 ${data.grid.cols}장 × 세로 ${data.grid.rows}장으로 깔면 경남 전체 지도가 됩니다. 축척은 약 1:${Math.round(1e6 / this.scale).toLocaleString()} (1km ≈ ${this.scale.toFixed(1)}mm)입니다. 맡은 장을 눌러 자세히 보세요.</p>
          <div class="sheet-buttons">${this.sheetInfo.map(s => `<button data-sheet="${s.no}" style="background:${s.color}">${s.no}번<br><small>${esc(s.name)}</small></button>`).join('')}</div>
          <h3>🚚 부품 업체 찾기 미션 (${data.parts.length}곳)</h3>
          <ul>${[...this.markers].sort((a, b) => a.no - b.no).map(mission).join('')}</ul>
          <p class="muted">🚀 ${esc(data.launchSite.name)}: ${esc(data.launchSite.place || data.launchSite.region)}${this.launch.outside ? ` (실제 위치는 경남 지도 밖${this.launch.sheet ? `, 지도에서는 ${this.launch.sheet}번 장 가장자리에 발사대를 둡니다` : ''})` : ` (${this.launch.sheet}번 장)`}</p>
          <p class="muted">지도 경계: ${esc(this.geo.source)}</p>`;
      } else {
        const si = this.sheetInfo[sheet - 1];
        const here = this.markers.filter(m => m.sheet === sheet);
        const lmList = si.regions.filter(r => r.main).flatMap(r => (data.landmarks[r.name] || []).map(l => `${l} <span class="muted">(${r.name})</span>`));
        this.panel.innerHTML = `
          <h2><span style="color:${si.color}">■</span> ${sheet}번 장 · ${esc(si.name)}</h2>
          <p class="muted">들어가는 시군: ${si.regions.map(r => r.main ? `<b>${esc(r.name)}</b>` : `${esc(r.name)} 일부`).join(', ')}</p>
          <p class="muted">화면의 한 칸 = 전지 위 ${data.grid.gridMm / 10}cm × ${data.grid.gridMm / 10}cm. 칸 이름(A1, C3 …)을 보고 같은 칸에 옮겨 그리세요.</p>
          <h3>✅ 꼭 들어가야 할 내용</h3>
          <ul class="check">${[...data.mustCommon, ...(si.must || [])].map(t => `<li>${esc(t)}</li>`).join('')}${this.launch.sheet === sheet ? `<li>🚀 ${esc(data.launchSite.name)} 그리기</li>` : ''}</ul>
          <h3>🎨 그릴 그림</h3>
          <ul>${lmList.map(l => `<li>${l}</li>`).join('') || '<li class="muted">이 장은 바다와 경계가 많아요. 바다와 섬을 그려 주세요.</li>'}</ul>
          <h3>🚚 이 장의 부품 업체</h3>
          <ul>${here.map(mission).join('') || '<li class="muted">이 장에는 부품 업체가 없어요.</li>'}</ul>`;
      }
      this.panel.querySelectorAll('[data-sheet]').forEach(b => b.onclick = () => this.show(+b.dataset.sheet));
    },
  };

  window.MapView = MapView;
})();
