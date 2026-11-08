// 엔트리(entryjs 4.0.23) 블록 모양을 그대로 따라 그리는 작은 SVG 그리기 도구.
// 모양 공식(skeleton path), 색, 글자 크기, 간격은 entryjs 원본 소스에서 옮겨 왔습니다.
(function () {
  const COLORS = {
    START: { fill: '#00b400', line: '#009400', arrow: '#FFFFFF' },
    FLOW: { fill: '#19baea', line: '#1498c0', arrow: '#3A71BC' },
    LOOKS: { fill: '#ff3a61', line: '#c72042', arrow: '#FFFFFF' },
    JUDGE: { fill: '#4562f5', line: '#1b3ad8', arrow: '#89A1F7' },
    VARIABLE: { fill: '#dd47d8', line: '#b819b3', arrow: '#FFFFFF' },
    HARDWARE: { fill: '#00b6b1', line: '#008380', arrow: '#FFFFFF' },
  };
  const NUM_FILL = '#ffde82'; // EntryStatic.colorSet.block.lighten.CALC
  const NUM_LINE = '#FF9C00'; // basic_string_field outerLine
  const ICONS = {
    hardware: 'icons/hardware_icon.svg',
    play: 'icons/start_icon_play.svg',
    key: 'icons/start_icon_keyboard.svg',
    signal: 'icons/start_icon_signal.svg',
    start: 'icons/start_icon.svg',
    flow: 'icons/flow_icon.svg',
    variable: 'icons/variable_icon.svg',
    looks: 'icons/looks_icon.svg',
  };
  const FONT = "'Nanum Gothic', NanumGothic, sans-serif";
  const PARAM_SPACE = 7;
  const ARROW_PATH = 'M 5.79 0.818 L 3.339 3.8 a 0.5 0.5 0 0 1 -0.772 0 L 0.114 0.818 A 0.5 0.5 0 0 1 0.5 0 h 4.904 a 0.5 0.5 0 0 1 0.387 0.818 z';

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  function tw(text, size) {
    ctx.font = `bold ${size}px ${FONT}`;
    return ctx.measureText(text).width;
  }
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // ---------- 블록 안의 칸(field) ----------
  // 각 함수는 {w, h, svg(x)} 를 돌려줍니다. svg는 가운데 높이 y=0 기준.
  function field(it, cat) {
    const col = COLORS[cat] || COLORS.HARDWARE;
    switch (it.t) {
      case 'txt': {
        const size = it.size || 12;
        const w = tw(it.v, size);
        return {
          w, h: 16, empty: it.v === '',
          svg: x => `<text x="${x}" y="0" dominant-baseline="central" font-family="${FONT}" font-weight="bold" font-size="${size}" fill="${it.color || '#fff'}" style="white-space:pre">${esc(it.v)}</text>`,
        };
      }
      case 'dd': {
        const size = it.size || (cat === 'HARDWARE' ? 11 : 10);
        const t = tw(it.v, size);
        const noArrow = !!it.noArrow;
        const w = t + (noArrow ? 10 : 20);
        const bg = it.bg || col.line;
        const arrowColor = it.arrow || col.arrow;
        return {
          w, h: 20,
          svg: x => `<g transform="translate(${x},0)"><rect x="0" y="-10" width="${w}" height="20" rx="2" ry="2" fill="${bg}"/>` +
            `<text x="5" y="0" dominant-baseline="central" font-family="${FONT}" font-weight="bold" font-size="${size}" fill="#fff" style="white-space:pre">${esc(it.v)}</text>` +
            (noArrow ? '' : `<path d="${ARROW_PATH}" fill="${arrowColor}" stroke="${arrowColor}" transform="translate(${w - 6.4 - 5},${-2.1})"/>`) + '</g>',
        };
      }
      case 'num': {
        const t = tw(it.v, 10);
        const cw = t;
        const h = 20;
        const width = Math.max(0, (cw < 10 ? cw : cw + 2) - h + 12);
        const total = width + h;
        const path = `M ${h / 2} 0 h ${width} a ${h / 2} ${h / 2} 0 1 1 0 ${h} H ${h / 2} a ${h / 2} ${h / 2} 0 0 1 0 -${h} z`;
        return {
          w: Math.max(total, cw + 15), h,
          svg: x => `<g transform="translate(${x},-10)"><path d="${path}" fill="${NUM_FILL}" stroke="${NUM_LINE}" stroke-width="1"/>` +
            `<text x="${(total - t) / 2}" y="10" dominant-baseline="central" font-family="${FONT}" font-weight="bold" font-size="10" fill="#000">${esc(it.v)}</text></g>`,
        };
      }
      case 'icon': {
        const size = it.size || 12;
        const hat = !!it.hat;
        const w = hat ? size : size * 2;
        return {
          w, h: size * 2,
          svg: x => `<image href="${ICONS[it.v]}" x="${hat ? x - size : x}" y="${-size + (hat ? -2 : 0)}" width="${size * 2}" height="${size * 2}"/>`,
        };
      }
      case 'rep': { // 값 블록(둥근 칸): 변수, 센서 값
        const rc = COLORS[it.cat];
        const inner = layoutItems(it.items, it.cat);
        const cw = inner.w;
        const h = 20;
        const width = Math.max(0, (cw < 10 ? cw : cw + 2) - h + 12);
        const total = width + h;
        const path = `M ${h / 2} 0 h ${width} a ${h / 2} ${h / 2} 0 1 1 0 ${h} H ${h / 2} a ${h / 2} ${h / 2} 0 0 1 0 -${h} z`;
        return {
          w: cw + 15, h,
          svg: x => `<g transform="translate(${x},-10)"><path d="${path}" fill="${rc.fill}" stroke="${rc.line}" stroke-width="1"/>` +
            `<g transform="translate(7,10)">${inner.svg}</g></g>`,
        };
      }
      case 'bool': { // 판단 블록(육각형)
        const rc = COLORS[it.cat || 'JUDGE'];
        const inner = layoutItems(it.items, it.cat || 'JUDGE');
        const cw = inner.w;
        const h = Math.max(20, inner.h);
        const width = Math.max(0, cw - h + 19);
        const x0 = h * 0.4;
        const path = `M ${h / 2} 0 l -${x0} ${h / 2} l ${x0} ${h / 2} h ${width} l ${x0} -${h / 2} l -${x0} -${h / 2} z`;
        return {
          w: cw + 19, h,
          svg: x => `<g transform="translate(${x},${-h / 2})"><path d="${path}" fill="${rc.fill}" stroke="${rc.line}" stroke-width="1"/>` +
            `<g transform="translate(10,${h / 2})">${inner.svg}</g></g>`,
        };
      }
      case 'ghost': { // 설명용 빈 칸(점선)
        const t = tw(it.v, 11);
        const w = t + 18;
        return {
          w, h: 20,
          svg: x => `<g transform="translate(${x},0)"><rect x="0" y="-10" width="${w}" height="20" rx="10" fill="#fff" fill-opacity=".85" stroke="#9a8878" stroke-dasharray="3 2"/>` +
            `<text x="9" y="0" dominant-baseline="central" font-family="${FONT}" font-weight="bold" font-size="11" fill="#6e5b4c">${esc(it.v)}</text></g>`,
        };
      }
    }
    throw new Error('unknown field ' + it.t);
  }

  function layoutItems(items, cat) {
    let x = 0, h = 0, svg = '';
    items.forEach((it, i) => {
      const f = field(it, cat);
      svg += f.svg(x);
      h = Math.max(h, f.h);
      x += f.w;
      if (i !== items.length - 1 && !f.empty) x += PARAM_SPACE;
    });
    return { w: x, h, svg };
  }

  // ---------- 블록 ----------
  // 돌려주는 값: {svg, h(다음 블록 자리), w(오른쪽 끝), rows:[{y,h,id}]}
  function block(b, ox, oy, rows) {
    const col = COLORS[b.cat];
    const st = `fill="${col.fill}" stroke="${col.line}" stroke-width="1" stroke-linejoin="round" stroke-linecap="round"`;
    const content = b.k === 'value' ? { w: 0, h: 0, svg: '' } : layoutItems(b.items, b.cat);
    const cw = content.w;
    const ch = content.h;
    if (b.k === 'value') { // 값/판단 블록 하나만 놓기
      const f = field(b.item, b.cat);
      rows && rows.push({ y: oy, h: f.h, id: b.id, x: ox, w: f.w });
      return { svg: `<g transform="translate(${ox},${oy + f.h / 2})">${f.svg(0)}</g>`, h: f.h, w: ox + f.w };
    }
    if (b.k === 'hat') {
      const W = Math.max(0, cw + 20) - 30;
      const path = `m 24 34 h ${W} a 14 14 0 0 0 0 -28 H 30 A 17 17 0 0 0 18 1 C 8.611 1 1 8.611 1 18 c 0 7.2 4.5 13.5 11 16 l 6 6 l 6 -6 z`;
      const svg = `<g transform="translate(${ox},${oy})"><path d="${path}" ${st}/><g transform="translate(18,20)">${content.svg}</g></g>`;
      rows && rows.push({ y: oy, h: 34, id: b.id, x: ox, w: cw + 28 });
      return { svg, h: 34, w: ox + cw + 28 };
    }
    if (b.k === 'cmd') {
      const height = Math.max(28, ch + 2);
      const width = Math.max(0, cw + 6 - height / 2);
      const hh = height / 2;
      const path = `M 0 0 l 6 6 l 6 -6 h ${width} a ${hh} ${hh} 0 0 1 0 ${height} h -${width} l -6 6 l -6 -6 z`;
      const svg = `<g transform="translate(${ox},${oy})"><path d="${path}" ${st}/><g transform="translate(14,${height / 2})">${content.svg}</g></g>`;
      rows && rows.push({ y: oy, h: height, id: b.id, x: ox, w: 12 + width + hh });
      return { svg, h: height, w: ox + 12 + width + hh };
    }
    if (b.k === 'loop') {
      const height = Math.max(28, ch);
      const width = Math.max(0, cw + 6 - height / 2);
      rows && rows.push({ y: oy, h: height, id: b.id, x: ox, w: 12 + width + height / 2 });
      const inner = stack(b.body || [], ox + 14, oy + 28, rows);
      const sh = Math.max(inner.h, 20);
      const bw = width - 8;
      const hh = height / 2;
      const path = `m 0 0 l 6 6 l 6 -6 h ${width} a ${hh} ${hh} 0 0 1 0 ${height} H 26 l -6 6 l -6 -6 v ${sh} l 6 6 l 6 -6 h ${bw} a 7.5 7.5 0 0 1 0 15 H 12 l -6 6 l -6 -6 z`;
      const svg = `<g transform="translate(${ox},${oy})"><path d="${path}" ${st}/><g transform="translate(14,${height / 2})">${content.svg}</g></g>` + inner.svg;
      return { svg, h: sh + 43, w: Math.max(ox + 12 + width + hh, inner.w) };
    }
    if (b.k === 'ifelse') {
      const second = layoutItems(b.items2 || [{ t: 'txt', v: '아니면' }], b.cat);
      const cwAll = Math.max(cw, 8 + second.w);
      const height1 = Math.max(30, ch + 2);
      const width = Math.max(0, cwAll + 2 - height1 / 2);
      rows && rows.push({ y: oy, h: 28, id: b.id, x: ox, w: 12 + width + 14 });
      const in1 = stack(b.body || [], ox + 14, oy + 28, rows);
      const sh1 = Math.max(in1.h, 20);
      rows && rows.push({ y: oy + 28 + sh1, h: 28, id: b.id2, x: ox, w: 12 + width + 14 });
      const in2 = stack(b.body2 || [], ox + 14, oy + sh1 + 56, rows);
      const sh2 = Math.max(in2.h, 20);
      const bw = width - 8;
      const path = `m 0 0 l 6 6 l 6 -6 h ${width} a 14 14 0 0 1 0 28 H 26 l -6 6 l -6 -6 v ${sh1} l 6 6 l 6 -6 h ${bw - 6} a 14 14 0 0 1 0 28 H 26 l -6 6 l -6 -6 v ${sh2} l 6 6 l 6 -6 h ${bw} a 7.5 7.5 0 0 1 0 15 H 12 l -6 6 l -6 -6 z`;
      const svg = `<g transform="translate(${ox},${oy})"><path d="${path}" ${st}/>` +
        `<g transform="translate(14,14)">${content.svg}</g>` +
        `<g transform="translate(22,${28 + sh1 + 14})">${second.svg}</g></g>` + in1.svg + in2.svg;
      return { svg, h: sh1 + sh2 + 71, w: Math.max(ox + 12 + width + 14, in1.w, in2.w) };
    }
    throw new Error('unknown block ' + b.k);
  }

  // 위에서 아래로 쌓기. 모자 블록 다음 블록은 x+12, y+34 에 붙습니다.
  function stack(list, ox, oy, rows) {
    let y = oy, x = ox, svg = '', w = ox, h = 0;
    list.forEach((b, i) => {
      const r = block(b, x, y, rows);
      svg += r.svg;
      w = Math.max(w, r.w);
      y += r.h;
      if (b.k === 'hat') x += 12;
    });
    return { svg, h: y - oy, w };
  }

  // 코드 묶음을 SVG 문자열로. scale배로 키움. pad: 둘레 여백(블록 단위)
  function render(list, opt = {}) {
    const scale = opt.scale || 2;
    const pad = opt.pad == null ? 4 : opt.pad;
    const rows = [];
    const r = stack(list, pad, pad, rows);
    const W = r.w + pad + 2;
    const H = r.h + pad + 8;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W * scale}" height="${H * scale}" viewBox="0 0 ${W} ${H}">${r.svg}</svg>`;
    return { svg, W: W * scale, H: H * scale, rows: rows.map(o => ({ ...o, y: o.y * scale, h: o.h * scale, x: o.x * scale, w: o.w * scale })), scale };
  }

  // ---------- 블록 만들기 도우미 ----------
  const T = v => ({ t: 'txt', v });
  const D = (v, o = {}) => ({ t: 'dd', v, ...o });
  const N = v => ({ t: 'num', v: String(v) });
  const HW = (items, id) => ({ k: 'cmd', cat: 'HARDWARE', items: [...items, { t: 'icon', v: 'hardware', size: 12 }], id });
  const E = {
    whenStart: id => ({ k: 'hat', cat: 'START', items: [{ t: 'icon', v: 'play', size: 14, hat: true }, T('시작하기 버튼을 클릭했을 때')], id }),
    whenKey: (key, id) => ({ k: 'hat', cat: 'START', items: [{ t: 'icon', v: 'key', size: 14, hat: true }, D(key, { size: 10 }), T('키를 눌렀을 때')], id }),
    whenSignal: (name, id) => ({ k: 'hat', cat: 'START', items: [{ t: 'icon', v: 'signal', size: 14, hat: true }, D(name, { size: 10 }), T('신호를 받았을 때')], id }),
    sendWait: (name, id) => ({ k: 'cmd', cat: 'START', items: [D(name, { size: 10 }), T('신호 보내고 기다리기'), { t: 'icon', v: 'start', size: 11 }], id }),
    wait: (s, id) => ({ k: 'cmd', cat: 'FLOW', items: [N(s), T('초 기다리기'), { t: 'icon', v: 'flow', size: 11 }], id }),
    repeatN: (n, body, id) => ({ k: 'loop', cat: 'FLOW', items: [N(n), T('번 반복하기'), { t: 'icon', v: 'flow', size: 11 }], body, id }),
    forever: (body, id) => ({ k: 'loop', cat: 'FLOW', items: [T('계속 반복하기'), { t: 'icon', v: 'flow', size: 11 }], body, id }),
    ifElse: (cond, body, body2, id, id2) => ({ k: 'ifelse', cat: 'FLOW', items: [T('만일'), cond, T('(이)라면'), { t: 'icon', v: 'flow', size: 11 }], body, body2, id, id2 }),
    setVar: (name, val, id) => ({ k: 'cmd', cat: 'VARIABLE', items: [D(name, { size: 10 }), T('를'), N(val), T('(으)로 정하기'), { t: 'icon', v: 'variable', size: 11 }], id }),
    varRep: name => ({ t: 'rep', cat: 'VARIABLE', items: [D(name, { size: 10 }), T('')] }),
    compare: (a, op, b) => ({ t: 'bool', cat: 'JUDGE', items: [a, D(op, { size: 10, noArrow: true }), b] }),
    say: (what, id) => ({ k: 'cmd', cat: 'LOOKS', items: [what, T('을(를)'), D('말하기', { size: 10 }), { t: 'icon', v: 'looks', size: 11 }], id }),
    sensor: name => ({ t: 'rep', cat: 'HARDWARE', items: [D(name, { size: 11 })] }),
    // 햄스터
    follow: (dir, id) => HW([D('검은색'), T('선을 따라'), D(dir), T('교차로까지 이동하기')], id),
    lineSpeed: (n, id) => HW([T('선 따라가기 속도를'), D(String(n)), T('(으)로 정하기')], id),
    stop: id => HW([T('정지하기')], id),
    grip: (act, id) => HW([T('집게'), D(act)], id),
    gripOff: id => HW([T('집게 끄기')], id),
    led: (side, color, id) => HW([D(side), T('LED를'), D(color), T('으로 정하기')], id),
    ledOff: (side, id) => HW([D(side), T('LED 끄기')], id),
    fwd: (s, id) => HW([T('앞으로'), N(s), T('초 이동하기')], id),
    back: (s, id) => HW([T('뒤로'), N(s), T('초 이동하기')], id),
    beep: id => HW([T('삐 소리내기')], id),
  };

  window.EB = { render, E, T, D, N, COLORS, field, layoutItems };
})();
