// ─────────────────────────────────────────────────────────────
// 수업 데이터: 이 파일만 고치면 화면 내용이 바뀝니다.
// (업체 목록은 수업 자료 준비가 끝나면 채워 넣습니다.)
// ─────────────────────────────────────────────────────────────
window.ROCKET_DATA = {
  // 학교와 반 (설정 화면에서도 바꿀 수 있습니다)
  schools: ['진해도천초등학교', '거제삼룡초등학교'],
  classes: [
    { school: 0, name: '1반', start: '2026-11-09' },
    { school: 0, name: '2반', start: '2026-11-09' },
    { school: 1, name: '1반', start: '2026-11-12' },
    { school: 1, name: '2반', start: '2026-11-12' },
  ],

  countdown: 10, // 발사 카운트다운(초)

  // 로켓 발사대 위치
  launchSite: { name: '로켓 발사대', region: '사천시', lon: 128.07, lat: 35.05, note: '우주항공청이 있는 사천' },

  // 전지 나누기: 세로 방향 전지(788×1091mm) 6장을 가로 3장 × 세로 2장으로 깔기
  // 번호는 왼쪽 위부터 1, 2, 3 / 아래 줄 4, 5, 6
  grid: { cols: 3, rows: 2, sheetW: 788, sheetH: 1091, gridMm: 100 },

  // 전지마다 꼭 들어가야 할 내용 (모든 장에 공통으로 들어갈 내용 + 장마다 추가)
  mustCommon: [
    '전자칠판의 10cm 칸에 맞춰 시군 경계선 그리기',
    '시군 이름 크게 쓰기',
    '시군마다 대표 그림 1개 이상 그리기',
    '부품 업체 자리에 ⭐와 부품 번호 표시하기',
    '옆 장과 경계선이 끊기지 않게 가장자리 맞추기',
    '햄스터봇이 다닐 길(검은 선)을 업체에서 발사대 쪽으로 이어 그리기',
  ],
  sheets: [
    { no: 1, name: '서북부', color: '#ffd6a5', must: ['지리산과 덕유산 같은 큰 산 그리기', '오른쪽(2번 장)과 아래(4번 장) 경계 맞추기'] },
    { no: 2, name: '중북부', color: '#caffbf', must: ['낙동강 물줄기를 파랗게 그리기', '가야산(합천) 그리기'] },
    { no: 3, name: '동북부', color: '#9bf6ff', must: ['낙동강이 바다로 가는 길 그리기', '오른쪽 끝은 경북·울산·부산과 닿는 경계'] },
    { no: 4, name: '서남부', color: '#a0c4ff', must: ['남해 바다를 파랗게 칠하기', '남해도 같은 섬 그리기', '로켓 발사대(사천) 크게 그리기'] },
    { no: 5, name: '중남부', color: '#bdb2ff', must: ['남강(진주) 물줄기 그리기', '통영 앞바다의 섬 그리기', '거제도 왼쪽 부분 그리기'] },
    { no: 6, name: '동남부', color: '#ffc6ff', must: ['진해만과 거제도 동쪽 그리기', '부산은 경남이 아니므로 회색으로 비워 두기'] },
  ],

  // 시군별 대표 그림(아이들이 그릴 거리)
  landmarks: {
    '거창군': ['🏞️ 수승대', '🌸 창포원'],
    '함양군': ['🌳 상림 숲', '⛰️ 지리산'],
    '산청군': ['⛰️ 지리산 천왕봉', '🌿 동의보감촌'],
    '합천군': ['📜 해인사 팔만대장경', '🌸 황매산 철쭉'],
    '의령군': ['🛡️ 홍의장군 곽재우', '🪨 솥바위'],
    '창녕군': ['🦢 우포늪', '🌾 화왕산 억새'],
    '밀양시': ['🏯 영남루', '🧊 얼음골'],
    '양산시': ['🛕 통도사'],
    '김해시': ['👑 수로왕릉', '🏺 가야 고분'],
    '하동군': ['🍵 녹차 밭', '🏪 화개장터'],
    '남해군': ['🏘️ 독일마을', '🌾 다랭이마을'],
    '사천시': ['✈️ 항공우주박물관', '🚠 바다케이블카'],
    '진주시': ['🏯 진주성', '🏮 남강 유등'],
    '함안군': ['🏺 말이산 고분군'],
    '고성군': ['🦕 공룡 발자국'],
    '창원시': ['🌸 진해 벚꽃', '🏭 기계공업단지'],
    '통영시': ['⚓ 한산도 이순신', '🎨 동피랑 벽화마을'],
    '거제시': ['🌬️ 바람의 언덕', '🚢 조선소'],
  },

  // 로켓 부품 12개 (아래에서 위로 쌓이는 순서)
  // shape: 로켓 그림에서 맡는 자리 (nozzle, finL, finR, body, band, engine2, avionics, payload, antenna, nose)
  // lon/lat: 업체 위치(없으면 시군 가운데). company/evidence: 강사용 정답(아이들 화면에서는 숨김)
  parts: [
    { no: 1, name: '1단 엔진', shape: 'nozzle', region: '창원시', lon: 128.70, lat: 35.13,
      question: '창원에서 로켓 엔진을 만드는 회사는 어디일까요?', company: '', evidence: null },
    { no: 2, name: '왼쪽 날개', shape: 'finL', region: '거창군',
      question: '거창에 있는 회사 중 단단하고 가벼운 재료를 만드는 곳은?', company: '', evidence: null },
    { no: 3, name: '오른쪽 날개', shape: 'finR', region: '함양군',
      question: '함양에서 날개에 쓸 부품을 만들 수 있는 회사는?', company: '', evidence: null },
    { no: 4, name: '1단 연료 탱크', shape: 'body', region: '밀양시',
      question: '밀양에서 탱크와 큰 금속 부품을 만드는 회사는?', company: '', evidence: null },
    { no: 5, name: '1단 산화제 탱크', shape: 'body', region: '창녕군',
      question: '창녕에서 압력을 견디는 통을 만드는 회사는?', company: '', evidence: null },
    { no: 6, name: '단 분리 장치', shape: 'band', region: '거제시', lon: 128.69, lat: 34.89,
      question: '거제에서 큰 구조물을 정밀하게 만드는 회사는?', company: '', evidence: null },
    { no: 7, name: '2단 엔진', shape: 'engine2', region: '양산시',
      question: '양산에서 엔진 부품을 만드는 회사는?', company: '', evidence: null },
    { no: 8, name: '2단 연료 탱크', shape: 'body', region: '진주시',
      question: '진주에 있는 항공우주 회사나 연구소는 어디일까요?', company: '', evidence: null },
    { no: 9, name: '유도 컴퓨터', shape: 'avionics', region: '합천군',
      question: '합천에서 전자 장치를 만드는 회사는?', company: '', evidence: null },
    { no: 10, name: '인공위성', shape: 'payload', region: '통영시',
      question: '통영에서 바다를 지켜보는 기술과 관련된 곳은?', company: '', evidence: null },
    { no: 11, name: '통신 안테나', shape: 'antenna', region: '하동군',
      question: '하동에서 통신 장비와 관련된 곳은?', company: '', evidence: null },
    { no: 12, name: '노즈콘(머리 덮개)', shape: 'nose', region: '남해군',
      question: '남해에서 로켓 머리를 지켜 줄 재료를 만드는 곳은?', company: '', evidence: null },
  ],
  // evidence 예시: { summary: '누리호 엔진을 만든 회사', source: '회사 누리집', url: 'https://...' }
};
