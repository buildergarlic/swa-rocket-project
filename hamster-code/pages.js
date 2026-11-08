// 이미지 11장의 내용
(function () {
  const { h, H, head, foot, board, blockImg, robot, crossPanel, INK } = D;
  const { E, T, N } = EB;
  const PAGES = {};
  const page = (...kids) => h('div', { class: 'page' }, ...kids);
  const card = (cls, title, ...kids) => h('div', { class: 'card ' + (cls || '') }, title ? h('h2', { html: title }) : null, ...kids);
  const ul = items => h('ul', {}, ...items.map(t => h('li', { html: t })));
  const ORANGE = '#ff8a3d';

  // 공통 코드 조각
  const pickup = p => [E.grip('열기', p + 'g1'), E.fwd('0.3', p + 'f'), E.grip('닫기', p + 'g2')];
  const ledIf = p => E.ifElse(E.compare(E.varRep('교차로 수'), '>', N(5)), [E.led('양쪽', '노란색', p + 'on')], [E.ledOff('양쪽', p + 'off')], p + 'if', p + 'else');
  const drop = p => [E.stop(p + 's'), E.grip('열기', p + 'g3'), E.back('0.5', p + 'b'), E.gripOff(p + 'go'), E.ledOff('양쪽', p + 'lo'), E.beep(p + 'bp')];
  const ROUTE1 = ['앞쪽', '앞쪽', '오른쪽', '앞쪽', '왼쪽', '앞쪽'];

  // ---------- 그림 도우미 ----------
  const svgEl = (w, hgt, vb, inner) => H(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${hgt}" viewBox="${vb}">${inner}</svg>`);
  const cupAt = (x, y) => `<circle cx="${x}" cy="${y}" r="10" fill="#ffffff" stroke="${INK}" stroke-width="3"/><rect x="${x - 6}" y="${y - 6}" width="12" height="12" rx="2" fill="#ff8fa3"/>`;
  const rocketIcon = (x, y, s = 1) => `<g transform="translate(${x},${y}) scale(${s})">
      <path d="M0,-34 C14,-22 16,-2 12,18 H-12 C-16,-2 -14,-22 0,-34 Z" fill="#ffffff" stroke="${INK}" stroke-width="4"/>
      <circle cx="0" cy="-8" r="6" fill="#8fd3ff" stroke="${INK}" stroke-width="3"/>
      <path d="M-12,6 L-22,22 L-11,20 Z M12,6 L22,22 L11,20 Z" fill="#ff8fa3" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M-6,20 Q0,36 6,20 Z" fill="#ffb347" stroke="${INK}" stroke-width="3"/></g>`;
  const factoryIcon = (x, y) => `<g transform="translate(${x},${y})">
      <path d="M-30,18 V-6 L-14,-16 V-6 L2,-16 V-6 L18,-16 V-26 H28 V18 Z" fill="#ffe9a3" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <rect x="-20" y="2" width="9" height="9" fill="${INK}"/><rect x="-4" y="2" width="9" height="9" fill="${INK}"/><rect x="12" y="2" width="9" height="9" fill="${INK}"/></g>`;
  const badge = (x, y, n) => `<g transform="translate(${x},${y})"><circle r="17" fill="${ORANGE}" stroke="${INK}" stroke-width="3.5"/><text y="1" text-anchor="middle" dominant-baseline="central" font-family="Jua" font-size="21" fill="#fff">${n}</text></g>`;
  const label = (x, y, t, anchor = 'start', size = 20, fill = INK) => `<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="central" font-family="Pretendard" font-weight="800" font-size="${size}" fill="${fill}">${t}</text>`;
  const pill = (x, y, t, bg = '#fff', size = 19) => {
    const w = t.length * size * 0.92 + 22;
    return `<g transform="translate(${x},${y})"><rect x="${-w / 2}" y="-17" width="${w}" height="34" rx="17" fill="${bg}" stroke="${INK}" stroke-width="3"/>${label(0, 1, t, 'middle', size)}</g>`;
  };

  // ================= 01 블록 꾸러미 =================
  PAGES['01'] = () => {
    const item = (b, desc, scale = 1.5) => h('div', { class: 'pitem' }, blockImg(b, scale), h('div', { class: 'pd', html: desc }));
    const chip = (name, color) => h('span', { class: 'chip', style: { background: color } }, name);
    const cat = (name, color, cls, items) => h('div', { class: 'card ' + cls, style: { padding: '18px 22px' } },
      h('h2', {}, chip(name, color)), h('div', { class: 'plist' }, ...items));
    return page(
      head({ no: '01', lesson: '전체', tags: [{ v: '블록 찾기', c: 'sky' }], title: '택배로봇 블록 꾸러미', sub: '이번 미션에서 쓰는 블록이에요. 어느 꾸러미에 있는지 찾아 보세요.' }),
      h('div', { class: 'row' },
        h('div', { class: 'col', style: { flex: '1' } },
          cat('시작', '#00b400', 'mint', [
            item(E.whenStart(), '▶ 시작하기를 누르면 아래 블록이 차례대로 움직여요.'),
            item(E.whenKey('1'), '키보드 <b>1</b>을 누르면 움직여요. 부품마다 1·2·3 키를 따로 써요.'),
            item(E.sendWait('부품 잡기'), '신호를 보내고, 그 일이 끝날 때까지 기다려요.'),
            item(E.whenSignal('부품 잡기'), '그 신호를 받으면 아래 블록이 움직여요.'),
          ]),
          cat('흐름', '#19baea', 'sky', [
            item(E.wait(1), '적힌 시간(초)만큼 기다려요.'),
            item(E.forever([]), '안쪽 블록을 계속 되풀이해요.'),
            item(E.ifElse(E.compare(E.varRep('교차로 수'), '>', N(5)), [], []), '조건이 맞으면 위쪽 칸,<br>아니면 아래쪽 칸의 블록을 해요.', 1.4),
          ]),
          cat('자료 · 판단 · 생김새', '#dd47d8', 'lav', [
            item(E.setVar('교차로 수', 6), '<b>[자료] → 변수 추가하기</b>로 만든 변수에 숫자를 적어요.'),
            item({ k: 'value', cat: 'JUDGE', item: E.compare(E.varRep('교차로 수'), '>', N(5)) }, '<b>[판단]</b> 교차로 수가 5보다 크면 \'참\'.'),
            item(E.say(E.sensor('왼쪽 바닥 센서')), '<b>[생김새]</b> 센서 값을 말풍선으로 보여 줘요.', 1.4),
          ])),
        h('div', { class: 'col', style: { flex: '1.08' } },
          cat('하드웨어 · 햄스터', '#00b6b1', 'mint', [
            item(E.lineSpeed(4), '선을 따라가는 빠르기. 1(느림)~8(빠름).'),
            item(E.follow('앞쪽'), '검은 선을 따라가다 <b>교차로</b>에서 앞쪽·왼쪽·오른쪽·뒤쪽으로 움직이고 멈춰요.', 1.4),
            item(E.stop(), '바퀴를 멈춰요.'),
            item(E.grip('열기'), '집게를 벌려요. (▾ 눌러 <b>닫기</b>로 바꾸면 오므려요)'),
            item(E.gripOff(), '집게 힘을 빼요. 배터리를 아껴요.'),
            item(E.fwd('0.3'), '0.3초 동안 살짝 앞으로 가요.'),
            item(E.back('0.5'), '0.5초 동안 뒤로 물러나요.'),
            item(E.led('양쪽', '노란색'), '양쪽 LED를 노란색으로 켜요. (장거리 표시등)'),
            item(E.ledOff('양쪽'), '양쪽 LED를 꺼요.'),
            item(E.beep(), '"삐" 소리로 도착을 알려요.'),
          ]),
          card('butter', null, h('p', { html: '햄스터 블록은 <b>햄스터봇을 연결해야</b> [하드웨어] 꾸러미에 나타나요.<br>햄스터 S를 쓰면 이름은 같고, \'앞으로·뒤로\' 블록만 <b>[초 ▾]</b> 단위를 골라요.' })),
          card('', '블록 색 = 꾸러미 색', h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '10px' } },
            ...[['시작', '#00b400'], ['흐름', '#19baea'], ['생김새', '#ff3a61'], ['판단', '#4562f5'], ['자료', '#dd47d8'], ['하드웨어', '#00b6b1']].map(([n, c]) => chip(n, c)))))),
      foot('01'));
  };

  // ================= 02 집게 시험 =================
  PAGES['02'] = () => page(
    head({ no: '02', lesson: '1차시', tags: [{ v: '준비', c: 'mint' }], title: '햄스터봇 연결하고 집게 시험하기', sub: '집게(그리퍼)가 잘 열리고 닫히는지 먼저 확인해요.' }),
    h('div', { class: 'row' },
      board({
        list: [E.whenStart('h'), E.grip('열기', 'a'), E.wait(1, 'w1'), E.grip('닫기', 'b'), E.wait(1, 'w2'), E.gripOff('c'), E.beep('d')],
        scale: 2.3, noteWidth: 400,
        notes: [
          { id: 'h', n: 1, text: '▶ 시작하기를 누르면 출발' },
          { id: 'a', n: 2, text: '집게가 <b>벌어져요</b>' },
          { id: 'w1', n: 3, text: '1초 기다려요' },
          { id: 'b', n: 4, text: '집게가 <b>오므라져요</b>' },
          { id: 'c', n: 5, text: '집게 힘을 빼요 (배터리 아끼기)' },
          { id: 'd', n: 6, text: '"삐!" 소리가 나면 성공!' },
        ],
        style: { flex: '1' },
      }),
      h('div', { class: 'col', style: { width: '470px', flex: 'none' } },
        card('mint', '연결 점검표', ul([
          '블루투스 동글을 컴퓨터에 꽂았어요',
          '엔트리 <b>하드웨어 연결</b>에서 <b>햄스터</b>를 연결했어요',
          '집게를 햄스터봇에 끼우고 케이블을 꽂았어요',
          '배터리가 충분해요',
          '로봇에 <b>1호·2호</b> 스티커를 붙였어요',
        ])),
        card('butter', '알아 두기', ul([
          '집게를 <b>열기·닫기</b> 상태로 두면 계속 전기를 써요. 다 쓰면 <b>[집게 끄기]</b>!',
          '햄스터 블록은 <b>하드웨어</b> 꾸러미에 있어요. 로봇을 연결해야 보여요.',
        ])))),
    foot('02'));

  // ================= 03 바닥 센서 =================
  PAGES['03'] = () => page(
    head({ no: '03', lesson: '2차시', tags: [{ v: '센서', c: 'sky' }], title: '바닥 센서로 검은 선 알아보기', sub: '햄스터봇 바닥에는 눈이 2개(왼쪽·오른쪽 바닥 센서) 있어요. 검은색과 흰색을 숫자로 봐요.' }),
    h('div', { class: 'row' },
      board({
        list: [E.whenStart('h'), E.forever([E.say(E.sensor('왼쪽 바닥 센서'), 's')], 'f')],
        scale: 2.2, noteWidth: 300, noteGap: 36,
        notes: [
          { id: 'h', n: 1, text: '▶ 시작하기를 누르면' },
          { id: 'f', n: 2, text: '계속 되풀이해요' },
          { id: 's', n: 3, text: '센서 값을 말풍선으로 보여 줘요. <b>▾</b>를 눌러 <b>오른쪽 바닥 센서</b>도 봐요.' },
        ],
        style: { flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
      }),
      h('div', { class: 'col', style: { width: '500px', flex: 'none' } },
        card('', '숫자 적어 보기',
          h('table', { class: 't' },
            h('tr', {}, h('th', {}, '로봇을 놓은 곳'), h('th', {}, '왼쪽'), h('th', {}, '오른쪽')),
            ...['흰 종이', '검은 테이프', '바다(색칠한 곳)', '시군 경계선'].map(t => h('tr', {}, h('td', {}, t), h('td', { class: 'blank' }, '______'), h('td', { class: 'blank' }, '______'))))),
        card('sky', '알게 된 점', ul([
          '검은색일수록 숫자가 <b>작고</b>, 흰색일수록 숫자가 <b>커요</b>. (0 ~ 100)',
          '바다나 경계선이 검은 테이프처럼 작은 숫자가 나오면 로봇이 <b>도로로 착각</b>해요. → 더 <b>연하게</b> 칠해요.',
        ])))),
    foot('03'));

  // ================= 04 선 따라가기와 교차로 =================
  PAGES['04'] = () => {
    const panels = ['앞쪽', '왼쪽', '오른쪽', '뒤쪽'].map(d => {
      const p = crossPanel(d);
      const box = h('div', { class: 'card', style: { padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '1' } });
      box.appendChild(H(p.svg));
      box.appendChild(h('div', { class: 'caption', html: `<span style="color:${ORANGE}">${d}</span><small>${p.label}</small>` }));
      return box;
    });
    return page(
      head({ no: '04', lesson: '2차시', tags: [{ v: '선 따라가기', c: 'sky' }], title: '검은 선 따라 교차로까지 가기', sub: '[검은색 선을 따라 ○○ 교차로까지 이동하기] 블록은 선을 따라가다 <b>교차로를 만나면</b> 고른 쪽으로 움직이고 멈춰요.' }),
      h('div', { class: 'row' }, ...panels),
      h('div', { class: 'rule' }, h('span', { class: 'big' }, '블록 1개 = 교차로 1개'), h('span', {}, '교차로를 하나 만날 때마다 블록이 하나씩 끝나요. (검은 선이 양쪽 센서에 모두 걸리는 곳이 교차로)')),
      h('div', { class: 'row' },
        board({
          label: '연습 코드: 두 번째 교차로에서 왼쪽',
          list: [E.whenStart('h'), E.lineSpeed(4, 'sp'), E.follow('앞쪽', 'f1'), E.follow('왼쪽', 'f2'), E.stop('st')],
          scale: 1.9, noteWidth: 300, noteGap: 36,
          notes: [
            { id: 'sp', n: 1, text: '속도 4로 시작 (1~8)' },
            { id: 'f1', n: 2, text: '첫 번째 교차로: 곧장 지나가요' },
            { id: 'f2', n: 3, text: '두 번째 교차로: 왼쪽으로 돌아요' },
            { id: 'st', n: 4, text: '멈춰요' },
          ],
          style: { flex: '1' },
        }),
        h('div', { class: 'col', style: { width: '420px', flex: 'none' } },
          card('pink', '도전!', h('p', { html: '연습 길에서 <b>"두 번째 교차로에서 오른쪽, 세 번째 교차로에서 왼쪽"</b>을 코드로 만들어 보세요.' })),
          card('butter', '꼭 확인', ul([
            '직선에서는 멈추지 않고, <b>교차로에서만</b> 멈추나요?',
            '방향은 <b>로봇 눈으로!</b> 로봇 뒤에 서서 왼쪽·오른쪽을 정해요.',
          ])))),
      foot('04'));
  };

  // ================= 05 부품 잡기 =================
  const frameBox = (vb, w, hgt, inner, cap, n) => {
    const box = h('div', { class: 'card frame' });
    box.appendChild(svgEl(w, hgt, vb, inner));
    box.appendChild(h('div', { class: 'caption fc', html: `<span class="cn">${n}</span>${cap}` }));
    return box;
  };
  const tag = (x, y, t, tx, ty, anchor = 'end') => `<path d="M${x},${y} L${tx},${ty}" stroke="${INK}" stroke-width="2" stroke-dasharray="2 3"/><circle cx="${x}" cy="${y}" r="2.6" fill="${INK}"/>` + label(tx + (anchor === 'end' ? -4 : 4), ty, t, anchor, 14);
  function pickupFrames() {
    const bg = `<rect x="0" y="0" width="220" height="300" fill="#fffdf8"/><rect x="88" y="0" width="44" height="300" fill="#222"/>`;
    const VB = '0 96 226 196', W = 380, HG = 330;
    const dim = `<path d="M152,146 V194" stroke="${INK}" stroke-width="2.5"/><path d="M146,146 H158 M146,194 H158" stroke="${INK}" stroke-width="2.5"/>${label(162, 170, '2~3cm', 'start', 14)}`;
    return [
      frameBox(VB, W, HG, bg + cupAt(110, 136) + robot(110, 240, 0, { grip: 'open' }) + dim + tag(100, 133, '부품 컵', 70, 118) + tag(91, 200, '집게', 64, 214), '집게 열기', 1),
      frameBox(VB, W, HG, bg + cupAt(110, 136) + robot(110, 176, 0, { grip: 'open' }) + `<path d="M110,270 V232" stroke="${ORANGE}" stroke-width="5" stroke-dasharray="2 9" stroke-linecap="round"/>` + label(150, 250, '0.3초 앞으로', 'start', 13, '#c2410c'), '앞으로 0.3초', 2),
      frameBox(VB, W, HG, bg + robot(110, 176, 0, { grip: 'closed', cup: true }) + label(150, 134, '꽉!', 'start', 15, '#c2410c'), '집게 닫기', 3),
    ];
  }
  PAGES['05'] = () => page(
    head({ no: '05', lesson: '3차시', tags: [{ v: '그리퍼', c: 'mint' }], title: '부품 잡기', sub: '업체 출발 자리에서 부품 컵을 집게로 꽉 잡아요. 배달 코드의 맨 앞에 넣어요.' }),
    h('div', { class: 'row' }, ...pickupFrames()),
    h('div', { class: 'row' },
      board({
        label: '부품 잡기 조각',
        list: pickup('p'),
        scale: 2.4, noteWidth: 400,
        notes: [
          { id: 'pg1', n: 1, text: '집게를 <b>벌려요</b>' },
          { id: 'pf', n: 2, text: '살짝 앞으로 가서 컵을 집게 사이에 넣어요' },
          { id: 'pg2', n: 3, text: '집게를 <b>오므려</b> 컵을 꽉 잡아요' },
        ],
        style: { flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
      }),
      h('div', { class: 'col', style: { width: '500px', flex: 'none' } },
        card('butter', '부품 컵 준비', ul([
          '부품 토큰을 <b>그리퍼 컵</b>(또는 작은 종이컵)에 양면테이프로 붙여 세워요.',
          '컵은 <b>검은 선 한가운데</b>, 로봇 앞 2~3cm에 놓아요.',
        ])),
        card('pink', '잘 안 잡히면', ul([
          '<b>0.3</b>을 0.2나 0.4로 바꿔 보세요.',
          '로봇을 선 위에 똑바로 놓았나요?',
        ])))),
    foot('05'));

  // ================= 06 장거리 LED =================
  PAGES['06'] = () => page(
    head({ no: '06', lesson: '3차시', tags: [{ v: 'LED', c: 'butter' }, { v: '변수·조건', c: 'lav' }], title: '장거리 배달이면 LED 켜기', sub: '멀리 가는 택배 트럭처럼, 교차로를 <b>5개보다 많이</b> 지나는 장거리 배달이면 노란 LED를 켜요.' }),
    h('div', { class: 'row' },
      board({
        list: [E.setVar('교차로 수', 6, 'v'), ledIf('l')],
        scale: 2.4, noteWidth: 400, noteGap: 50,
        notes: [
          { id: 'v', n: 1, text: '경로 계획서에서 센 <b>교차로 개수</b>를 적어요' },
          { id: 'lif', n: 2, text: '교차로 수가 <b>5보다 크면</b>' },
          { id: 'lon', n: 3, text: '장거리! 양쪽 LED <b>노란색</b>' },
          { id: 'lelse', n: 4, text: '아니면 (가까운 길)' },
          { id: 'loff', n: 5, text: 'LED를 꺼요' },
        ],
        style: { flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center' },
      }),
      h('div', { class: 'col', style: { width: '470px', flex: 'none' } },
        card('lav', '변수 만들기', ul([
          '<b>[자료]</b> 꾸러미 → <b>변수 추가하기</b>',
          '이름: <b>교차로 수</b> → 확인',
          '<b>[교차로 수 를 ( ) (으)로 정하기]</b> 블록이 생겨요',
        ])),
        card('butter', '이렇게 돼요',
          h('div', { class: 'ledpair' },
            h('div', {}, svgEl(120, 120, '-60 -74 120 120', robot(0, 0, 0, { grip: 'closed', s: 1.4 })), h('span', { html: '교차로 <b>4개</b><br>LED 꺼짐' })),
            h('div', {}, svgEl(120, 120, '-60 -74 120 120', robot(0, 0, 0, { grip: 'closed', s: 1.4, led: true })), h('span', { html: '교차로 <b>6개</b><br><b style="color:#c99700">노란 LED 켜짐</b>' })))),
        card('', null, h('p', { html: '발사대의 <b>+ 표시</b>도 교차로 1개로 세요. 기준 <b>5</b>는 우리 반 지도에 맞게 선생님과 정해요.' })))),
    foot('06'));

  // ================= 07 경로 계획서 → 코드 =================
  function routeMap() {
    const roads = `<g stroke="#222" stroke-width="24" stroke-linecap="square" fill="none">
      <path d="M470,70 V470"/><path d="M300,170 H560"/><path d="M380,300 H560"/><path d="M60,430 H560"/>
      <path d="M300,170 V560"/><path d="M150,330 V600"/><path d="M118,560 H182"/></g>`;
    const routeLine = `<path d="M470,108 V430 H150 V548" stroke="${ORANGE}" stroke-width="7" fill="none" stroke-dasharray="2 13" stroke-linecap="round" stroke-linejoin="round"/>`;
    const turns = [[470, 170, 1, '앞쪽'], [470, 300, 2, '앞쪽'], [470, 430, 3, '오른쪽'], [300, 430, 4, '앞쪽'], [150, 430, 5, '왼쪽'], [150, 560, 6, '앞쪽']];
    const marks = turns.map(([x, y, n, d]) => {
      const bx = n === 3 ? x + 34 : n === 6 ? x + 38 : n >= 4 ? x - 30 : x + 34;
      const by = n === 3 ? y + 34 : n === 6 ? y : n >= 4 ? y - 32 : y - 30;
      const lx = n === 3 ? bx + 24 : n === 6 ? bx + 24 : n >= 4 ? bx : bx + 24;
      const ly = n >= 4 && n !== 6 ? by - 30 : by;
      const anchor = n >= 4 && n !== 6 ? 'middle' : 'start';
      return badge(bx, by, n) + label(lx, ly, d, anchor, 21, '#c2410c');
    }).join('');
    const inner = `<rect x="2" y="2" width="616" height="716" rx="24" fill="#f3fbff" stroke="${INK}" stroke-width="4"/>
      ${roads}${routeLine}${marks}
      ${factoryIcon(540, 70)}${pill(545, 22, '출발: 업체')}
      ${robot(470, 92, 180, { grip: 'closed', cup: true, s: .75 })}
      ${rocketIcon(150, 655, .95)}${pill(255, 660, '고흥 발사대', '#ffe9a3')}
      ${label(196, 586, '+ 표시', 'start', 18)}`;
    return svgEl(620, 720, '0 0 620 720', inner);
  }
  PAGES['07'] = () => page(
    head({ no: '07', lesson: '3차시', tags: [{ v: '경로 설계', c: 'pink' }], title: '경로 계획서를 코드로 바꾸기', sub: '출발 업체에서 발사대까지, 교차로를 만나는 순서대로 블록을 한 줄씩 쌓아요.' }),
    h('div', { class: 'row' },
      h('div', { class: 'card', style: { padding: '16px', flex: 'none' } }, h('h2', {}, '예시 지도'), routeMap()),
      h('div', { class: 'col', style: { flex: '1' } },
        board({
          list: [E.setVar('교차로 수', 6, 'v'), ...ROUTE1.map((d, i) => E.follow(d, 'r' + i))],
          scale: 1.7, noteWidth: 150, noteGap: 30,
          notes: [
            { id: 'v', text: '교차로 6개' },
            ...ROUTE1.map((d, i) => ({ id: 'r' + i, n: i + 1, text: d })),
          ],
        }),
        card('butter', '경로 계획서 쓰는 법', ul([
          '출발 업체에서 발사대까지 손가락으로 길을 따라가요.',
          '교차로를 만날 때마다 번호를 붙이고 <b>앞쪽·왼쪽·오른쪽</b>을 적어요. <b>로봇 눈으로!</b>',
          '발사대 <b>+ 표시</b>가 마지막 교차로예요(앞쪽).',
          '교차로 개수 = <b>교차로 수</b>, 번호 순서대로 블록을 쌓아요.',
        ])))),
    foot('07'));

  // ================= 08 내려놓기 =================
  function dropFrames() {
    const bg = `<rect x="0" y="0" width="220" height="300" fill="#fffdf8"/><rect x="40" y="0" width="140" height="58" rx="14" fill="#ffe9a3" stroke="${INK}" stroke-width="3"/>` +
      `<rect x="88" y="40" width="44" height="260" fill="#222"/><rect x="62" y="128" width="96" height="44" fill="#222"/>` + rocketIcon(110, 26, .62);
    const VB = '0 0 226 290', W = 300, HG = 385;
    return [
      frameBox(VB, W, HG, bg + robot(110, 150, 0, { grip: 'closed', cup: true }) + tag(160, 150, '+ 표시', 172, 196, 'start') + label(46, 20, '발사대', 'start', 14), '+ 표시에서 멈춤', 1),
      frameBox(VB, W, HG, bg + cupAt(110, 110) + robot(110, 150, 0, { grip: 'open' }), '집게 열기', 2),
      frameBox(VB, W, HG, bg + cupAt(110, 110) + robot(110, 236, 0, { grip: 'open' }) + `<path d="M110,196 V180" stroke="${ORANGE}" stroke-width="5" stroke-linecap="round"/>` + label(150, 226, '뒤로', 'start', 14, '#c2410c') + tag(101, 112, '컵은 그대로', 82, 86, 'end'), '뒤로 0.5초', 3),
    ];
  }
  PAGES['08'] = () => page(
    head({ no: '08', lesson: '3차시', tags: [{ v: '그리퍼', c: 'mint' }, { v: '도착 알림', c: 'pink' }], title: '부품 내려놓고 도착 알리기', sub: '발사대 + 표시에서 멈추면 컵을 내려놓고 물러나요. "삐!" 소리가 나면 선생님이 전자칠판에서 부품 번호를 눌러요.' }),
    h('div', { class: 'row' }, ...dropFrames()),
    h('div', { class: 'row' },
      board({
        label: '내려놓기 조각',
        list: drop('d'),
        scale: 2.2, noteWidth: 400,
        notes: [
          { id: 'ds', n: 1, text: '멈춰요' },
          { id: 'dg3', n: 2, text: '집게를 벌려 컵을 내려놓아요' },
          { id: 'db', n: 3, text: '뒤로 물러나요 (컵은 발사대에!)' },
          { id: 'dgo', n: 4, text: '집게 힘을 빼요' },
          { id: 'dlo', n: 5, text: '장거리 LED를 꺼요' },
          { id: 'dbp', n: 6, text: '"삐!" 도착을 알려요' },
        ],
        style: { flex: '1' },
      }),
      h('div', { class: 'col', style: { width: '470px', flex: 'none' } },
        card('butter', '지도팀에게', ul([
          '발사대 앞 도로에 가로 6cm 테이프를 붙여 <b>+ 표시</b>를 만들어요.',
          '도로는 + 표시 너머로 <b>5cm 더</b> 이어 붙여요.',
          '발사대 그림은 + 표시 바로 앞에 그려요.',
        ])))),
    foot('08'));

  // ================= 09 완성 코드 =================
  PAGES['09'] = () => {
    const list = [
      E.whenKey('1', 'k'),
      E.setVar('교차로 수', 6, 'v'),
      E.lineSpeed(4, 'sp'),
      ...pickup('p'),
      ledIf('l'),
      ...ROUTE1.map((d, i) => E.follow(d, 'r' + i)),
      ...drop('d'),
    ];
    return page(
      head({ no: '09', lesson: '3·4차시', tags: [{ v: '완성 코드', c: 'pink' }], title: '완성! 부품 1개 배달 코드', sub: '05~08에서 만든 조각을 차례대로 이으면 배달 코드가 돼요.' }),
      board({
        list, scale: 2.1,
        brackets: [
          { from: 'k', to: 'k', color: '#00b400', label: '① 키보드 1을 누르면 출발', sub: '먼저 ▶시작하기를 누른 뒤 1 키', width: 560 },
          { from: 'v', to: 'sp', color: '#b819b3', label: '② 준비', sub: '교차로 수 적기, 선 따라가기 속도 4', width: 560 },
          { from: 'pg1', to: 'pg2', color: '#00b6b1', label: '③ 부품 잡기', sub: '05번 조각', width: 560 },
          { from: 'lif', to: 'loff', color: '#19baea', label: '④ 장거리면 LED 켜기', sub: '06번 조각', width: 560 },
          { from: 'r0', to: 'r5', color: ORANGE, label: '⑤ 경로: 교차로마다 한 줄', sub: '07번 경로 계획서대로 바꿔요', width: 560 },
          { from: 'ds', to: 'dbp', color: '#c72042', label: '⑥ 내려놓고 도착 알림', sub: '08번 조각', width: 560 },
        ],
      }),
      h('div', { class: 'steps' },
        h('div', { class: 'step', html: '<span class="n">1</span>로봇을 업체 출발 자리에 놓고, 부품 컵을 2~3cm 앞에 세워요.' }),
        h('div', { class: 'step', html: '<span class="n">2</span>엔트리에서 <b>▶ 시작하기</b>를 눌러요.' }),
        h('div', { class: 'step', html: '<span class="n">3</span>키보드 <b>1</b>을 누르면 출발! "삐" 소리가 나면 선생님께 알려요.' })),
      foot('09'));
  };

  // ================= 10 부품 3개(신호) =================
  PAGES['10'] = () => {
    const keyScript = (key, n, route) => [E.whenKey(key), E.setVar('교차로 수', n), E.sendWait('부품 잡기'), ...route.map(d => E.follow(d)), E.sendWait('부품 내려놓기')];
    const R2 = ['왼쪽', '앞쪽', '오른쪽', '앞쪽'];
    const R3 = ['앞쪽', '오른쪽', '앞쪽', '앞쪽', '왼쪽', '앞쪽', '오른쪽', '앞쪽'];
    const kb = (key, n, route, lab) => board({ label: lab, list: keyScript(key, n, route), scale: 1.3, style: { flex: '1', padding: '18px 16px' } });
    return page(
      head({ no: '10', lesson: '3·4차시', tags: [{ v: '정리', c: 'lav' }, { v: '신호', c: 'mint' }], title: '로봇 1대가 부품 3개 배달하기', sub: '똑같이 쓰는 블록은 <b>신호</b>로 묶고, 부품마다 <b>교차로 수</b>와 <b>경로</b>만 바꿔요.' }),
      h('div', { class: 'row' },
        kb('1', 6, ROUTE1, '1 키 · 첫 번째 부품 (6개 → LED 켜짐)'),
        kb('2', 4, R2, '2 키 · 두 번째 부품 (4개 → LED 꺼짐)'),
        kb('3', 8, R3, '3 키 · 세 번째 부품 (8개 → LED 켜짐)')),
      h('div', { class: 'row' },
        board({ label: '부품 잡기 (신호를 받으면)', list: [E.whenSignal('부품 잡기'), E.lineSpeed(4), ...pickup('x'), ledIf('y')], scale: 1.6, style: { flex: '1' } }),
        board({ label: '부품 내려놓기 (신호를 받으면)', list: [E.whenSignal('부품 내려놓기'), ...drop('z')], scale: 1.6, style: { flex: '1' } })),
      h('div', { class: 'row' },
        card('mint', '신호 만들기', h('p', { html: '<b>[속성]</b> 탭 → <b>[신호]</b> → <b>신호 추가하기</b>로 <b>부품 잡기</b>, <b>부품 내려놓기</b>를 만들어요.' })),
        card('butter', '경로는 예시예요', h('p', { html: '우리 모둠 경로 계획서대로 블록과 교차로 수를 바꿔요. 다음 부품은 로봇을 그 업체 출발 자리에 옮겨 놓고 키를 눌러요.' }))),
      foot('10'));
  };

  // ================= 11 문제 해결 =================
  PAGES['11'] = () => {
    const P = (ic, q, a) => h('div', { class: 'prob' }, h('div', { class: 'q' }, h('span', { class: 'ic' }, ic), h('span', {}, q)), h('div', { class: 'a', html: a }));
    return page(
      head({ no: '11', lesson: '리허설·4차시', tags: [{ v: '문제 해결', c: 'pink' }], title: '로봇이 이상해요! 이렇게 고쳐요', sub: '고칠 때는 한 번에 하나씩 바꾸고 다시 시험해요.' }),
      h('div', { class: 'grid3' },
        P('1', '직선 도로인데 멈춰요', '바다·경계선을 <b>더 연하게</b>, 도로 옆 그림은 3cm 떨어뜨려요. 그래도 멈추면 선이 센서보다 굵은지 <b>좁은 테이프로 시험</b>해요.'),
        P('2', '선을 놓치고 밖으로 나가요', '선 따라가기 속도를 <b>3</b>으로 낮춰요. 꺾이는 길은 <b>둥글게</b> 붙이거나 <b>교차로(+)</b>로 만들어요.'),
        P('3', '교차로를 그냥 지나쳐요', '교차로 테이프를 <b>빈틈없이 맞대어</b> 붙여요. 테이프 이음새가 들뜨지 않게 꾹 눌러요.'),
        P('4', '엉뚱한 쪽으로 돌아요', '방향은 <b>로봇 눈으로!</b> 경로 계획서와 블록을 한 줄씩 짚으며 맞춰 봐요. 빠진 교차로가 없는지 세어 봐요.'),
        P('5', '컵을 못 잡아요', '<b>앞으로 0.3초</b>를 0.2~0.4초로 바꿔요. 컵을 <b>선 한가운데</b>, 2~3cm 앞에 세워요.'),
        P('6', '집게가 안 움직여요', '케이블이 잘 꽂혔는지, 배터리가 충분한지 봐요. <b>[집게 끄기]</b> 뒤 02번 코드로 다시 시험해요.'),
        P('7', '키를 눌러도 가만히 있어요', '먼저 <b>▶ 시작하기</b>를 눌렀나요? 엔트리 화면을 한 번 클릭한 뒤 키를 눌러요. 하드웨어 연결도 확인!'),
        P('8', 'LED가 안 켜져요', '<b>교차로 수</b>가 5보다 큰지, 조건 블록에 <b>교차로 수</b> 변수를 넣었는지 확인해요.'),
        P('9', '다른 로봇과 부딪혀요', '한 번에 <b>3모둠(6대)씩</b> 번갈아 출발해요. 출발 전에 길이 비었는지 봐요.')),
      foot('11'));
  };

  window.PAGES = PAGES;
})();
