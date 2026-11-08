import json, sys, html
C = json.load(open('/mnt/project-files/lesson-materials/companies.json'))
P = {p['no']: p for p in C['parts']}
A = '/home/user/swa-rocket-project/slides/assets/'
NAVY = '0B1E3F'; NAVY2 = '15305E'; YEL = 'FFC83D'; WHITE = 'FFFFFF'; ORG = 'FF7A3D'; SKY = '8FD3FF'; GRAY = 'C9D3E6'
TF = 'Black Han Sans'; BF = None
ZC = {1: 'F6C9A8', 2: 'C8F0C0', 3: 'A8EEF5', 4: 'B9D3FF', 5: 'D2C6FF', 6: 'F9C6F0'}
slides = []; cnt = [0]
cur = None
def nid(p):
    cnt[0] += 1; return f'{p[0]}{cnt[0]:04d}'
def slide(bg=NAVY):
    global cur
    cur = {'bg': bg, 'els': []}; slides.append(cur); return len(slides) - 1
def esc(t): return html.escape(t).replace('\n', '<br>')
def text(sid, x, y, w, h, t, size=16, color=WHITE, bold=False, font=BF, align=None, fill=None, valign=None, shape='TEXT_BOX', ls=None):
    oid = nid('t')
    va = {'MIDDLE': 'center', 'TOP': 'flex-start', None: 'flex-start'}[valign]
    css = f'left:{x}px;top:{y}px;width:{w}px;height:{h}px;font-size:{size}px;color:#{color};justify-content:{va};'
    css += f'text-align:{(align or "LEFT").lower()};font-weight:{700 if bold else 400};line-height:{(ls or 112)/100*1.08};'
    if font == TF: css += "font-family:'Black Han Sans';font-weight:400;"
    if fill: css += f'background:#{fill};border-radius:{0 if len(fill)>6 else 10}px;padding:8px 12px;'
    else: css += 'padding:2px 4px;'
    cur['els'].append({'id': oid, 'css': css, 't': t, 'spans': []})
    return oid
def box(sid, x, y, w, h, t, fill, size=14, color=NAVY, bold=False, align=None, font=BF, valign='MIDDLE'):
    return text(sid, x, y, w, h, t, size, color, bold, font, align, fill, valign, 'ROUND_RECTANGLE')
def bold_part(oid, start, end, color=None, size=None):
    for e in cur['els']:
        if e.get('id') == oid: e['spans'].append((start, end, color, size))
def rich(sid, x, y, w, h, lines, size=15, color=WHITE, hcolor=YEL, fill=None, ls=115):
    full = ''; heads = []
    for i, l in enumerate(lines):
        if l.startswith('#'):
            l = l[1:]; heads.append((len(full), len(full) + len(l)))
        full += l + ('\n' if i < len(lines) - 1 else '')
    oid = text(sid, x, y, w, h, full, size, color, fill=fill, ls=ls, valign='TOP')
    for a, b in heads: bold_part(oid, a, b, hcolor)
    return oid
def img(sid, name, x, y, w, h):
    cur['els'].append({'img': A + name, 'css': f'left:{x}px;top:{y}px;width:{w}px;height:{h}px;'})
def title(sid, t, sub=None):
    text(sid, 28, 14, 664, 44, t, 28, YEL, font=TF)
    if sub: text(sid, 30, 54, 660, 24, sub, 13, GRAY)
def table(sid, x, y, w, h, rows, colw, size=11, head=ORG, fills=None):
    fills = fills or {}
    hh = '<table style="width:100%;height:100%">'
    for r, row in enumerate(rows):
        hh += '<tr>'
        for c, v in enumerate(row):
            bg = head if r == 0 else (fills.get(r) if c == 0 and r in fills else 'FFFFFF')
            col = 'FFFFFF' if r == 0 else '111111'
            fw = 700 if (r == 0 or c == 0) else 400
            hh += f'<td style="width:{colw[c]}px;background:#{bg};color:#{col};font-weight:{fw};font-size:{size}px">{esc(v)}</td>'
        hh += '</tr>'
    cur['els'].append({'html': hh + '</table>', 'css': f'left:{x}px;top:{y}px;width:{w}px;height:{h}px;'})
# ---------------- slides ----------------
zone_info = {
 1: ('서북부', '거창, 함양, 산청, 합천 일부', [3, 4], [1, 2], '오른쪽 2구역, 아래 4구역',
     ['거창 사과', '함양 상림숲', '산청 지리산 천왕봉과 동의보감촌', '합천 해인사 팔만대장경']),
 2: ('중북부', '합천, 창녕, 의령, 함안', [5, 6], [1, 4, 6, 8], '왼쪽 1구역, 오른쪽 3구역, 아래 5구역',
     ['창녕 우포늪과 따오기', '의령 망개떡, 의병장 곽재우', '함안 말이산 고분군(아라가야)', '합천 황매산 철쭉']),
 3: ('동북부', '밀양, 양산, 김해 북부', [7, 8], [6, 10, 11], '왼쪽 2구역, 아래 6구역',
     ['밀양 영남루와 밀양아리랑', '밀양 얼음골 사과', '양산 통도사', '낙동강 물길']),
 4: ('서남부', '하동, 남해, 사천, 진주 서부', [9, 10], [2, 3, 5, 7], '위 1구역, 오른쪽 5구역',
     ['로켓 발사대를 가장 크게! (사천)', '사천 바다케이블카, 항공우주박물관', '하동 녹차밭과 화개장터', '남해 독일마을, 다랭이마을']),
 5: ('중남부', '진주, 고성, 통영, 창원 서부, 거제 서부', [1, 2, 11], [3, 4, 5, 7, 8, 9, 12], '왼쪽 4구역, 위 2구역, 오른쪽 6구역',
     ['진주성과 남강 유등축제', '고성 공룡 발자국', '통영 한산도와 이순신 장군', '창원 공장 단지']),
 6: ('동남부', '창원 진해, 김해 남부, 거제 동부', [12], [9, 10, 11, 12], '왼쪽 5구역, 위 3구역',
     ['진해 군항제 벚꽃', '김해 수로왕릉(금관가야)', '거제 바람의 언덕과 조선소', '우리 학교 위치에 별 표시!']),
}
team_parts = {1: [3, 4], 2: [5, 6], 3: [7, 8], 4: [9, 10], 5: [2, 11], 6: [12, 1]}
TYPE = {'real': '누리호 참여 확인', 'aero': '항공우주 기업 (부품은 수업용 연결)', 'similar': '닮은 기술 지역 기업'}

def short_sigun(p):
    return p['sigun'].split(' (')[0]

# 1. Title
s = slide()
text(s, 36, 60, 380, 30, '햄스터봇 창의융합 프로젝트', 18, SKY, True)
text(s, 34, 92, 400, 110, '경남 로켓\n발사 작전', 50, YEL, font=TF, ls=95)
text(s, 36, 222, 380, 50, '햄스터봇 택배로봇이 경남 곳곳의 로켓 부품 12개를\n사천 발사대까지 배달하면 로켓이 발사된다!', 14, WHITE, ls=120)
text(s, 36, 300, 380, 60, '초등학교 5, 6학년 · 엔트리 블록코딩\n진해도천초등학교 · 거제삼룡초등학교', 13, GRAY, ls=125)
img(s, 'launch.jpg', 420, 40, 280, 159)
img(s, 'rocket_screen.jpg', 420, 206, 280, 158)
text(s, 420, 366, 280, 20, '전자칠판: 부품이 도착할 때마다 로켓이 조립되고, 다 모이면 발사!', 9, GRAY, align='CENTER')

# 2. Mission story
s = slide(); title(s, '미션 이야기', '선생님이 읽어 주세요')
box(s, 40, 92, 640, 170, '“경남 곳곳의 부품 업체에서 로켓 부품 12개가 완성됐다!\n그런데 택배 트럭이 모두 멈춰 버렸다.\n\n우리 모둠의 햄스터봇 택배로봇이 부품을 사천 발사대까지 배달해야 한다.\n부품이 하나씩 도착할 때마다 전자칠판의 로켓이 조립되고,\n12개가 모두 모이면 로켓이 하늘로 발사된다!”', NAVY2, 17, WHITE, align='CENTER')
o = text(s, 40, 272, 640, 120, '우리가 할 일\n① 조사: 우리 구역 부품을 만드는 진짜 경남 회사 찾기\n② 지도: 전지에 우리 구역 지도 그리고 꾸미기\n③ 코딩: 햄스터봇이 공장에서 발사대까지 길을 따라가게 만들기\n④ 발사: 12개 부품을 모두 모아 로켓 발사!', 13, WHITE, ls=140)
bold_part(o, 0, 6, YEL, 15)

# 3. Real story
s = slide(); title(s, '진짜 이야기: 누리호와 경남', '우리가 만드는 로켓은 진짜 경남 기업들의 이야기에서 출발해요')
facts = [('2026년 10월', '누리호 5차 발사에\n경남 기업 11곳이 참여했어요'),
         ('사천', '우주항공청(2024년 5월 개청)과\nKAI가 누리호를 총조립하는 곳'),
         ('창원', '한화에어로스페이스가\n누리호 75톤 엔진을 만들었어요'),
         ('밀양', '한국화이바가 나로호·누리호의\n꼭대기 덮개(페어링)를 만들었어요')]
for i, (a, b) in enumerate(facts):
    x = 40 + i * 162
    box(s, x, 100, 150, 70, a, YEL, 20, NAVY, True, 'CENTER', TF)
    box(s, x, 178, 150, 100, b, NAVY2, 13, WHITE, False, 'CENTER')
text(s, 40, 300, 640, 60, '그래서 우리 프로젝트의 발사대는 사천(4구역)에 있어요.\n부품 12개는 모두 실제 경남 기업과 연결되어 있어요. 어떤 회사인지는 여러분이 직접 조사해서 찾아요!', 13, GRAY, ls=135)

# 4. Overview of 4 lessons
s = slide(); title(s, '프로젝트 한눈에 보기', '반마다 2주 동안 4차시 (차시당 80분)')
L = [('1차시', '미션 시작!\n부품 업체를 찾아라', '구역 배정, 역할 정하기\n업체 조사와 발표\n디자이너: 전지에 격자\n개발자: 햄스터봇 연결, 기본 이동'),
     ('2차시', '우리 구역\n지도 만들기', '디자이너: 경계, 바다, 도로 테이프, 공장 그리기, 꾸미기\n개발자: 라인 따라가기, 교차로에서 멈추고 돌기'),
     ('3차시', '택배 경로 설계와\n리허설', '6장 이어 붙이기\n경로 계획서 쓰기\n배달 코드 만들기\n리허설'),
     ('4차시', '경남 로켓\n발사!', '부품 2개 배달 본 미션\n12개 모이면 카운트다운\n로켓 발사 영상\n돌아보기')]
for i, (a, b, c) in enumerate(L):
    x = 40 + i * 162
    box(s, x, 90, 150, 34, a, ORG, 16, WHITE, True, 'CENTER', TF)
    box(s, x, 130, 150, 60, b, YEL, 14, NAVY, True, 'CENTER')
    box(s, x, 196, 150, 150, c, NAVY2, 12, WHITE, False, 'CENTER')

# 5. What we build
s = slide(); title(s, '우리가 함께 만드는 것')
B = [('경남 지도 (전지 6장)', '세로로 세운 전지 6장을\n가로 3장 × 세로 2장으로 이어요.\n완성 크기 2.36m × 2.18m\n축척 약 1:66,000 (1km ≈ 1.5cm)\n도로는 폭 2cm 검은 절연테이프'),
     ('햄스터봇 택배로봇', '엔트리 블록코딩으로 움직여요.\n바닥 센서로 검은 도로를 따라가요.\n교차로에서 멈추고 방향을 바꿔요.\n모둠마다 부품 2개를 배달해요.'),
     ('전자칠판 로켓', '부품이 발사대에 도착하면\n로켓이 한 칸씩 조립돼요.\n12개가 모두 모이면\n카운트다운과 함께 발사!')]
for i, (a, b) in enumerate(B):
    x = 40 + i * 216
    box(s, x, 90, 204, 40, a, YEL, 16, NAVY, True, 'CENTER')
    box(s, x, 138, 204, 180, b, NAVY2, 13, WHITE, False, 'CENTER')
text(s, 40, 335, 640, 40, '6모둠 × 부품 2개 = 12개 부품 → 로켓 1대 발사', 18, YEL, True, align='CENTER')

# 6. Group making
s = slide(); title(s, '모둠 나누기', '한 반을 6모둠으로 나누고, 모둠마다 경남 1개 구역을 맡아요')
box(s, 40, 92, 300, 120, '기본: 4인 모둠\n디자이너 2명 + 개발자 2명', YEL, 18, NAVY, True, 'CENTER')
box(s, 380, 92, 300, 120, '3인 모둠도 가능\n디자이너 1명 + 개발자 2명', SKY, 18, NAVY, True, 'CENTER')
table(s, 40, 230, 640, 120, [['반 인원', '4인 모둠', '3인 모둠', '모둠 수'],
                              ['24명', '6개', '-', '6모둠'],
                              ['23명', '5개', '1개', '6모둠'],
                              ['22명', '4개', '2개', '6모둠'],
                              ['21명', '3개', '3개', '6모둠']], [160, 160, 160, 160], 12)
text(s, 40, 360, 640, 30, '모둠 번호 = 맡을 구역 번호 (1모둠 → 1구역 … 6모둠 → 6구역). 5구역에 부품이 3개라서 6모둠은 12번과 5구역의 1번을 배달해요.', 11, GRAY)

# 7. Roles
s = slide(); title(s, '역할 나누기', '조사와 부품 리포트는 모둠 모두가 함께 해요')
box(s, 40, 88, 315, 34, '디자이너 (지도 담당)', ORG, 17, WHITE, True, 'CENTER', TF)
box(s, 365, 88, 315, 34, '개발자 (코딩 담당)', '3E7BFA', 17, WHITE, True, 'CENTER', TF)
rich(s, 40, 128, 315, 160, ['#디자이너 A · 지도 팀장', '확대 도안 읽기, 전지에 10cm 격자 그리기,', '시군 경계와 해안선, 도로 테이프 붙이기', '#디자이너 B · 꾸미기와 기록', '공장 그림과 부품 번호, 지역 명소 꾸미기,', '조사 결과와 부품 리포트 정리'], 15, WHITE, YEL, NAVY2, 140)
rich(s, 365, 128, 315, 160, ['#개발자 A · 블록 조립', '엔트리 코드 만들기: 이동, 회전,', '라인 따라가기, 교차로 판단, 배달 코드', '#개발자 B · 로봇 연결과 시험', '햄스터봇 연결과 충전 확인, 출발 위치 놓기,', '시험 기록과 경로 계획서 작성'], 15, WHITE, YEL, NAVY2, 140)
box(s, 40, 298, 640, 90, '3인 모둠 (디자이너 1 + 개발자 2): 디자이너 1명이 지도 그리기와 꾸미기를 모두 맡아요.\n2차시 도로 테이프 붙이기와 3차시 지도 이어 붙이기는 개발자 B가 10분 정도 함께 도와요.\n부품 리포트는 3명이 나눠서 써요.', SKY, 14, NAVY, False, 'CENTER')

# 8. Full map
s = slide(); title(s, '경남 전체 지도와 6구역')
img(s, 'map_full.jpg', 28, 66, 362, 333)
rich(s, 405, 70, 290, 330, ['#6구역 나누기', '전지 6장: 위 1·2·3구역, 아래 4·5·6구역', '#표시 읽는 법', '🚀 로켓 발사대: 사천 (4구역)', '공장 아이콘 번호 = 부품 번호 (1~12)', '빨강: 누리호 참여가 기사로 확인된 회사', '파랑: 항공우주 회사 (부품은 수업용 연결)', '보라: 로켓과 닮은 기술을 가진 지역 회사', '검은 선: 햄스터봇 도로 (2cm 테이프)', '주황 동그라미: 연결점 번호 1~12', '이웃 구역과 도로가 만나는 곳이에요', '#우리 학교는?', '진해도천초: 6구역 (창원 진해)', '거제삼룡초: 거제 (5·6구역)'], 12, WHITE, YEL, NAVY2, 118)

# 9. Zone table
s = slide(); title(s, '6구역과 부품 한눈에 보기', '어떤 회사가 만드는지는 조사해서 찾아요!')
rows = [['구역', '주요 시군', '부품 (번호)', '배달 모둠']]
for z in range(1, 7):
    nm, sg, parts, _, _, _ = zone_info[z]
    rows.append([f'{z}구역 {nm}', sg, ', '.join(f"{n} {P[n]['part'].split(' (')[0]}" for n in parts) + (' + 로켓 발사대' if z == 4 else ''),
                 f'{z}모둠' + (' (2, 11)' if z == 5 else ' (12, 그리고 1)' if z == 6 else '')])
table(s, 30, 84, 660, 300, rows, [90, 170, 290, 110], 11, fills={z: ZC[z] for z in range(1, 7)})

# 10. How to draw
s = slide(); title(s, '디자이너: 지도 그리는 순서', '모든 구역이 같은 순서로 그려요')
steps = ['1. 전지를 세로로 놓고 아래쪽에 구역 번호를 크게 써요',
         '2. 연필로 10cm 격자를 그려요 (가로 7칸 + 8.8cm, 세로 10칸 + 9.1cm)',
         '3. 확대 도안의 칸을 보며 시군 경계를 한 칸씩 옮겨 그려요',
         '4. 시군 경계는 사인펜 점선, 해안선은 실선, 바다는 연한 파랑',
         '5. 도로는 폭 2cm 검은 절연테이프 (교차로는 겹치지 말고 맞대기)',
         '6. 공장 그림과 부품 번호, 연결점 번호를 크게 표시해요',
         '7. 우리 구역 명소와 특산물로 꾸며요 (도로 위는 비워 두기)']
text(s, 40, 86, 430, 290, '\n'.join(steps), 13, WHITE, ls=150)
box(s, 490, 90, 200, 280, '주의!\n\n바다와 경계선을 진하게 칠하면 햄스터봇 바닥 센서가 도로로 착각해요.\n\n연한 색으로 칠하고, 검은색은 도로에만 써요.\n\n도로는 연결점에서 전지 끝까지 꼭 이어 붙여요.', ORG, 13, WHITE, False, 'CENTER')

# 11-16 Zones
for z in range(1, 7):
    nm, sg, parts, conns, nb, deco = zone_info[z]
    s = slide()
    img(s, f'zone{z}.jpg', 24, 18, 278, 368)
    text(s, 318, 18, 380, 44, f'{z}구역 · {nm}', 30, YEL, font=TF)
    text(s, 320, 62, 380, 22, f'{z}모둠 담당 · 시군: {sg}', 12, GRAY)
    must = ['#꼭 그릴 것']
    for n in parts:
        must.append(f'부품 {n} 공장: {P[n]["part"].split(" (")[0]} ({short_sigun(P[n])})')
    if z == 4: must.append('로켓 발사대 (사천) - 가장 크고 눈에 띄게')
    must.append('도로(검은 테이프)와 도시 교차로')
    must.append('연결점 ' + ', '.join(map(str, conns)) + f'번 (이웃: {nb})')
    must.append('#꾸미기 아이디어')
    must += ['· ' + d for d in deco]
    rich(s, 318, 90, 380, 296, must, 15, WHITE, YEL, NAVY2, 135)

# 17. Research
s = slide(); title(s, '부품 업체 조사하기', '조사 카드의 질문과 힌트로 진짜 회사를 찾아요')
st = [('질문 읽기', '조사 카드의 질문을\n모둠이 함께 읽어요'), ('검색하기', '힌트 검색어로 시작하고,\n안 나오면 말을 바꿔요'),
      ('확인하기', '뉴스 기사와 회사 누리집만\n증거로 써요 (광고, 블로그 X)'), ('기록하기', '회사, 시군, 만드는 것,\n신문 이름과 날짜')]
for i, (a, b) in enumerate(st):
    x = 40 + i * 162
    box(s, x, 100, 150, 44, f'{i + 1}. {a}', YEL, 16, NAVY, True, 'CENTER')
    box(s, x, 152, 150, 100, b, NAVY2, 13, WHITE, False, 'CENTER')
box(s, 40, 272, 640, 100, '발표 문장 틀\n“우리 구역의 ○○○(회사)는 ○○시에 있고, 로켓의 ○○○을(를) 만들어요.\n우리는 ○○신문 ○○년 ○월 기사에서 확인했어요.”', SKY, 15, NAVY, False, 'CENTER')

# 18. Report form
s = slide(); title(s, '부품 상세 리포트 쓰기', '모둠마다 부품 2개, 한 장씩 써요')
left = ['#① 부품 번호와 이름', '#② 이 부품이 로켓에서 하는 일', '내 말로 한두 문장', '#③ 만든 회사 이름', '#④ 회사 위치', '시군, 지도 구역 번호', '#⑤ 증거 (출처)', '기사 제목, 신문 이름, 날짜']
right = ['#⑥ 진짜 로켓 부품일까?', '□ 누리호 참여가 기사로 확인됨', '□ 항공우주 회사 (부품은 수업용 연결)', '□ 로켓과 닮은 기술을 가진 회사', '#⑦ 발사대까지 배달 경로', '공장 → 지나는 도시 → 연결점 번호 → 사천', '#⑧ 새로 알게 된 점, 궁금한 점', '#⑨ 부품 그림 (지도에도 붙여요)']
rich(s, 40, 86, 315, 296, left, 15, WHITE, YEL, NAVY2, 140)
rich(s, 365, 86, 315, 296, right, 15, WHITE, YEL, NAVY2, 140)

# 19-24 Part cards
for t, (a, b) in team_parts.items():
    s = slide(); title(s, f'{t}모둠이 찾을 부품', f'{t}구역 담당' + (' · 1번은 5구역에 있어요' if t == 6 else ''))
    for i, n in enumerate([a, b]):
        p = P[n]; x = 30 + i * 335
        box(s, x, 84, 325, 306, '', NAVY2)
        img(s, f'part{n}.jpg', x + 12, 96, 100, 83)
        text(s, x + 120, 96, 200, 30, f'부품 {n}', 13, ORG, True)
        text(s, x + 120, 116, 200, 64, p['part'], 15, YEL, True)
        rich(s, x + 10, 186, 305, 200, ['#하는 일', p['kid_role'], '#조사 질문', p['question'], '#힌트', p['hint'], f'#위치: {short_sigun(p)} ({p["sheet"]}구역)'], 13, WHITE, YEL, None, 118)

# 25 teacher divider
s = slide('3A1A1A')
text(s, 40, 120, 640, 70, '강사용: 정답과 근거', 40, YEL, font=TF, align='CENTER')
text(s, 40, 200, 640, 60, '모둠 발표가 끝난 뒤에 보여 주세요.\n“닮은 기술” 회사는 실제로 로켓 부품을 만들지 않는다는 점을 꼭 말해 주세요.', 15, WHITE, align='CENTER', ls=140)

# 26-27 answers
order = [3, 4, 5, 6, 7, 8, 9, 10, 2, 11, 12, 1]
for k in range(2):
    s = slide(); title(s, f'정답: 부품 업체 12곳 ({k + 1}/2)', '근거 기사와 출처 링크는 강사용 근거 자료집에 있어요')
    rows = [['부품', '회사', '위치', '구분']]
    for n in order[k * 6:(k + 1) * 6]:
        p = P[n]
        rows.append([f'{n}. {p["part"]}', p['company'], f'{p["sigun"]} · {p["sheet"]}구역', TYPE[p['type']]])
    table(s, 30, 84, 660, 300, rows, [190, 180, 150, 140], 10)

# 28 coding
s = slide(); title(s, '개발자: 엔트리 + 햄스터봇 코딩 단계', '차시마다 한 단계씩 올라가요')
cs = [('1차시', '기본 이동', '엔트리에 햄스터봇 연결\n“앞으로 이동하기”\n“왼쪽/오른쪽으로 돌기”\n책상 위 ㄱ자 길 완주'),
      ('2차시', '라인 따라가기', '왼쪽·오른쪽 바닥 센서 값 보기\n검은 선 따라가기\n교차로(양쪽 센서 모두 검정)\n에서 멈추고 돌기'),
      ('3차시', '배달 코드', '경로 계획서대로\n교차로마다 직진/왼쪽/오른쪽\n공장 → 발사대 리허설\n걸린 시간 기록'),
      ('4차시', '본 미션', '부품 2개 실제 배달\n부품당 기회 3번\n실패하면 고쳐서 다시!\n코드는 모둠 이름으로 저장')]
for i, (a, b, c) in enumerate(cs):
    x = 40 + i * 162
    box(s, x, 90, 150, 30, a, '3E7BFA', 14, WHITE, True, 'CENTER')
    box(s, x, 126, 150, 40, b, YEL, 16, NAVY, True, 'CENTER')
    box(s, x, 172, 150, 150, c, NAVY2, 12, WHITE, False, 'CENTER')
text(s, 40, 336, 640, 40, '연결이 안 되면 동글 페어링을 확인해요. 책상 끝에서 떨어지지 않게 조심!', 12, GRAY, align='CENTER')

# 29 route plan
s = slide(); title(s, '택배 경로 계획서', '부품마다 한 장씩 (3차시)')
table(s, 40, 86, 640, 220, [['순서', '지나는 곳', '교차로에서 할 일', '확인'],
                            ['출발', '부품 ○번 공장 (○○시)', '도로 위 출발 방향 맞추기', '□'],
                            ['1', '○○ 교차로', '직진 / 왼쪽 / 오른쪽', '□'],
                            ['2', '연결점 ○번 (다음 구역으로)', '직진 / 왼쪽 / 오른쪽', '□'],
                            ['3', '○○ 교차로', '직진 / 왼쪽 / 오른쪽', '□'],
                            ['도착', '사천 로켓 발사대', '멈추고 부품 내려놓기', '□']], [80, 240, 240, 80], 12)
text(s, 40, 318, 640, 60, '지도는 6모둠이 함께 써요. 2모둠씩 번갈아 시험하고, 4모둠(발사대 구역)은\n사천 근처 교차로를 많이 지나는 우회 경로에 도전해요.', 12, GRAY, ls=135)

# 30 lesson 1 timeline
s = slide(); title(s, '1차시 흐름 (80분)', '미션 시작! 부품 업체를 찾아라')
table(s, 30, 84, 660, 290, [['단계', '시간', '활동'],
                            ['미션 브리핑', '10분', '전자칠판 빈 발사대와 6구역 지도, 미션 이야기, 누리호와 경남 기업'],
                            ['구역·역할 배정', '5분', '6모둠에 1~6구역 배정, 디자이너·개발자 역할 정하기'],
                            ['업체 조사', '25분', '조사 카드 2장으로 검색, 회사·시군·출처 기록'],
                            ['발표', '10분', '모둠별 1분 발표 → 정답과 근거 확인'],
                            ['역할별 활동', '25분', '디자이너: 전지 10cm 격자 / 개발자: 햄스터봇 연결, ㄱ자 길'],
                            ['정리', '5분', '찾은 업체 2곳 다시 말하기, 다음 차시 예고']], [130, 60, 470], 12)

# 31 lesson 4 + launch rules
s = slide(); title(s, '4차시: 경남 로켓 발사!', '본 미션 규칙')
rich(s, 40, 86, 400, 296, ['#배달 규칙', '부품이 발사대에 도착하면', '선생님이 전자칠판에서 그 부품을 조립해요', '부품당 기회는 3번', '3번 실패하면 선생님과 함께 수동 배달', '도착 순서는 상관없어요', '#발사!', '12개가 모두 모이면 반 전체 카운트다운', '10, 9, 8 … 3, 2, 1, 발사!'], 16, WHITE, YEL, NAVY2, 140)
box(s, 456, 86, 224, 296, '조립 순서\n(전자칠판)\n\n1단 엔진 → 연료 배관 → 탱크 구조물 → 탱크 설계도 → 동체와 탱크 → 극저온 단열재 → 열 차단막 → 알루미늄 → 단 연결 이음쇠 → 동체 패널 → 냉각 기술 → 페어링', YEL, 12, NAVY, False, 'CENTER')

# 32 reflection
s = slide(); title(s, '돌아보기', '4차시 마무리 15분')
qs = ['우리 구역 회사를 조사하며 새로 알게 된 것은?', '지도와 코드를 만들며 가장 어려웠던 점은? 어떻게 해결했나요?', '디자이너와 개발자가 서로 어떻게 도왔나요?', '우리 동네 가까이에서 진짜 로켓 부품이 만들어진다는 것, 어떤 생각이 드나요?']
for i, q in enumerate(qs):
    box(s, 60, 90 + i * 72, 600, 60, q, NAVY2 if i % 2 else '1F3D73', 15, WHITE, False, 'CENTER')

# 33-34 finale
for sch in ['진해도천초등학교', '거제삼룡초등학교']:
    s = slide('050B1A')
    img(s, 'launch.jpg', 0, -2, 720, 409)
    text(s, 0, 250, 720, 155, '', fill='000000CC')
    text(s, 30, 262, 660, 50, f'{sch} 학생들의', 30, WHITE, font=TF, align='CENTER')
    text(s, 30, 310, 660, 70, '로켓 발사를 축하합니다!', 44, YEL, font=TF, align='CENTER')


def render_el(e):
    if 'img' in e: return f'<img src="file://{e["img"]}" style="position:absolute;{e["css"]}object-fit:contain">'
    if 'html' in e: return f'<div style="position:absolute;{e["css"]}">{e["html"]}</div>'
    t = e['t']; out = ''; pos = 0
    for a, b, col, sz in sorted(e['spans']):
        out += esc(t[pos:a]); st = 'font-weight:700;' + (f'color:#{col};' if col else '') + (f'font-size:{sz}px;' if sz else '')
        out += f'<span style="{st}">{esc(t[a:b])}</span>'; pos = b
    out += esc(t[pos:])
    return f'<div class="t" style="{e["css"]}"><div>{out}</div></div>'
CSS = """<link href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Noto+Sans+KR:wght@400;700&display=block" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0}body{width:720px;height:405px;overflow:hidden;font-family:'Noto Sans KR',sans-serif;position:relative}
.t{position:absolute;display:flex;flex-direction:column;white-space:normal;word-break:keep-all}
table{border-collapse:collapse;table-layout:fixed}td{border:1px solid #9AA8C4;padding:3px 6px;line-height:1.25;word-break:keep-all}</style>"""
import os
os.makedirs('pages', exist_ok=True)
for i, s in enumerate(slides):
    stars = '' 
    h = f'<html><head><meta charset="utf-8">{CSS}</head><body style="background:#{s["bg"]}">' + ''.join(render_el(e) for e in s['els']) + '</body></html>'
    open(f'pages/s{i+1:02d}.html', 'w').write(h)
print(len(slides))
