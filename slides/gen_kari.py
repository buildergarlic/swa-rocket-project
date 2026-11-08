"""경남 로켓 발사 작전 수업 슬라이드 (KARI 사이트 느낌의 기관형 디자인).
companies.json을 읽어 slides/pages/sNN.html을 만들고, shot.js로 1920x1080 이미지를 찍는다.
"""
import json, html, os

C = json.load(open('/mnt/project-files/lesson-materials/companies.json'))
P = {p['no']: p for p in C['parts']}
HERE = os.path.dirname(os.path.abspath(__file__))
A = 'file://' + os.path.join(HERE, 'assets') + '/'
OUT = os.path.join(HERE, 'pages')
os.makedirs(OUT, exist_ok=True)

def e(t):
    return html.escape(str(t)).replace('\n', '<br>')

def short(p):
    return p['part'].split(' (')[0]

def sigun(p):
    return p['sigun'].split(' (')[0]

CSS = """
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;900&family=Montserrat:wght@500;700;800&display=block" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--navy:#061433;--deep:#030A1F;--blue:#0B5FD7;--sky:#3DA5FF;--cyan:#38D0F5;--ink:#0D1B33;--sub:#5A6B85;--line:#D8E1EE;--bg:#F3F6FA;--orange:#FF6B2C}
body{width:1280px;height:720px;overflow:hidden;font-family:'Noto Sans KR',sans-serif;color:var(--ink);position:relative;word-break:keep-all;letter-spacing:-0.01em}
.en{font-family:'Montserrat',sans-serif;letter-spacing:0.12em}
.light{background:var(--bg)}
.dark{background:radial-gradient(ellipse at 75% 20%,#0E2A66 0%,#061433 45%,#030A1F 100%);color:#fff}
.stars{position:absolute;inset:0;background-image:radial-gradient(1px 1px at 20px 30px,#fff8,transparent),radial-gradient(1px 1px at 140px 90px,#fff6,transparent),radial-gradient(1.5px 1.5px at 260px 50px,#fff9,transparent),radial-gradient(1px 1px at 330px 160px,#fff5,transparent);background-size:360px 200px;opacity:.6}
.top{position:absolute;left:64px;top:44px;right:64px;display:flex;align-items:center;gap:14px}
.kicker{font-size:15px;font-weight:700;color:var(--blue)}
.dark .kicker{color:var(--cyan)}
.kbar{width:28px;height:3px;background:var(--blue)}
.dark .kbar{background:var(--cyan)}
h1.t{position:absolute;left:64px;top:72px;right:64px;font-size:40px;font-weight:900;letter-spacing:-0.03em;line-height:1.25}
.lead{position:absolute;left:64px;top:128px;right:64px;font-size:20px;color:var(--sub)}
.dark .lead{color:#B9C7E0}
.foot{position:absolute;left:64px;right:64px;bottom:22px;display:flex;justify-content:space-between;font-size:12px;color:#8A99B2;border-top:1px solid var(--line);padding-top:10px}
.dark .foot{border-color:#ffffff22;color:#7F90B5}
.foot b{color:var(--blue);font-weight:700}.dark .foot b{color:var(--cyan)}
.body{position:absolute;left:64px;right:64px;top:176px;bottom:70px}
.card{background:#fff;border:1px solid var(--line);border-radius:6px;padding:22px 24px;box-shadow:0 2px 10px #0d1b330a}
.dark .card{background:#ffffff0d;border-color:#ffffff22;box-shadow:none}
.num{font-family:'Montserrat';font-weight:800;color:var(--blue);font-size:16px;letter-spacing:.08em}
.dark .num{color:var(--cyan)}
.ct{font-size:26px;font-weight:900;margin:6px 0 12px;letter-spacing:-0.02em}
.cx{font-size:20px;line-height:1.6;color:#33435E}
.dark .cx{color:#D3DCEC}
.grid{display:grid;gap:18px;height:100%}
.tag{display:inline-block;font-size:13px;font-weight:700;padding:4px 10px;border-radius:999px;background:#E6F0FF;color:var(--blue);margin-right:6px}
.tag.o{background:#FFEDE4;color:#D9480F}.tag.p{background:#F1E8FF;color:#7048E8}.tag.g{background:#E3F7EC;color:#2B8A3E}
table{border-collapse:collapse;width:100%;background:#fff;font-size:18px}
th{background:var(--navy);color:#fff;font-weight:700;text-align:left;padding:12px 14px;font-size:17px}
td{border-bottom:1px solid var(--line);padding:10px 14px;line-height:1.4;vertical-align:middle}
td:first-child{font-weight:700}
ul.l{list-style:none}ul.l li{position:relative;padding-left:20px;font-size:20px;line-height:1.5;margin-bottom:9px;color:#33435E}
ul.l li:before{content:'';position:absolute;left:0;top:13px;width:7px;height:7px;background:var(--blue)}
.dark ul.l li{color:#D3DCEC}.dark ul.l li:before{background:var(--cyan)}
.big{font-size:56px;font-weight:900;letter-spacing:-0.04em;line-height:1.15}
img{display:block}
.zone{display:inline-block;width:14px;height:14px;border-radius:3px;vertical-align:-1px;margin-right:6px}
</style>"""

FOOT = '햄스터봇 창의융합 프로젝트 <b>경남 로켓 발사 작전</b>'
pages = []
SEC = {1: '프로젝트 소개', 2: '모둠과 역할', 3: '경남 지도 만들기', 4: '부품 조사와 리포트', 5: '코딩과 배달', 6: '수업 운영과 발사', 7: '강사용 자료'}

def page(inner, dark=False, sec=None, kicker=None, title=None, lead=None, foot=True):
    n = len(pages) + 1
    h = f'<html><head><meta charset="utf-8">{CSS}</head><body class="{"dark" if dark else "light"}">'
    if dark: h += '<div class="stars"></div>'
    if kicker or sec:
        k = kicker or ''
        s = f'<span class="en" style="font-size:13px;font-weight:700;color:{"#38D0F5" if dark else "#0B5FD7"}">{sec:02d}</span>' if sec else ''
        h += f'<div class="top">{s}<div class="kbar"></div><div class="kicker">{e(SEC.get(sec, "") if sec and not kicker else k)}</div></div>'
    if title: h += f'<h1 class="t">{e(title)}</h1>'
    if lead: h += f'<div class="lead">{e(lead)}</div>'
    h += inner
    if foot: h += f'<div class="foot"><span>{FOOT}</span><span class="en">{n:02d}</span></div>'
    h += '</body></html>'
    pages.append(h)

def section(no, title, sub):
    page(f'''<img src="{A}launch.jpg" style="position:absolute;right:0;top:0;height:720px;width:640px;object-fit:cover;opacity:.55">
<div style="position:absolute;right:0;top:0;width:640px;height:720px;background:linear-gradient(90deg,#061433 0%,#06143300 60%)"></div>
<div style="position:absolute;left:64px;top:220px">
<div class="en" style="font-size:20px;font-weight:800;color:#38D0F5">PART {no:02d}</div>
<div style="font-size:64px;font-weight:900;letter-spacing:-0.04em;margin-top:10px">{e(title)}</div>
<div style="width:64px;height:4px;background:#38D0F5;margin:26px 0"></div>
<div style="font-size:21px;color:#C7D3EA;line-height:1.6">{e(sub)}</div></div>''', dark=True)

def cards(items, cols, height=None, extra=''):
    h = f'<div class="grid" style="grid-template-columns:repeat({cols},1fr);{("height:" + str(height) + "px") if height else ""}">'
    for it in items:
        num, t, x = it
        h += f'<div class="card"><div class="num">{e(num)}</div><div class="ct">{e(t)}</div><div class="cx">{e(x)}</div></div>'
    return h + '</div>' + extra

# ---------- 경남 구역 정보 ----------
ZONE = {
 1: ('서북부', '거창, 함양, 산청, 합천 일부', [3, 4], [1, 2], '오른쪽 2구역 · 아래 4구역', ['거창 사과', '함양 상림숲', '산청 지리산 천왕봉, 동의보감촌', '합천 해인사 팔만대장경'], '#F6C9A8'),
 2: ('중북부', '합천, 창녕, 의령, 함안', [5, 6], [1, 4, 6, 8], '왼쪽 1구역 · 오른쪽 3구역 · 아래 5구역', ['창녕 우포늪과 따오기', '의령 망개떡, 의병장 곽재우', '함안 말이산 고분군(아라가야)', '합천 황매산 철쭉'], '#C8F0C0'),
 3: ('동북부', '밀양, 양산, 김해 북부', [7, 8], [6, 10, 11], '왼쪽 2구역 · 아래 6구역', ['밀양 영남루와 밀양아리랑', '밀양 얼음골 사과', '양산 통도사', '낙동강 물길'], '#A8EEF5'),
 4: ('서남부', '하동, 남해, 사천, 진주 서부', [9, 10], [2, 3, 5, 7], '위 1구역 · 오른쪽 5구역', ['고흥 발사대를 크게! (왼쪽 아래 바다)', '사천 우주항공청, 항공우주박물관', '하동 녹차밭과 화개장터', '남해 독일마을, 다랭이마을'], '#B9D3FF'),
 5: ('중남부', '진주, 고성, 통영, 창원 서부, 거제 서부', [1, 2, 11], [3, 4, 5, 7, 8, 9, 12], '왼쪽 4구역 · 위 2구역 · 오른쪽 6구역', ['진주성과 남강 유등축제', '고성 공룡 발자국', '통영 한산도와 이순신 장군', '창원 기계 공업 단지'], '#D2C6FF'),
 6: ('동남부', '창원 진해, 김해 남부, 거제 동부', [12], [9, 10, 11, 12], '왼쪽 5구역 · 위 3구역', ['진해 군항제 벚꽃', '김해 수로왕릉(금관가야)', '거제 바람의 언덕과 조선소', '우리 학교 위치에 별 표시'], '#F9C6F0'),
}
ZONE = {z: (v[0], v[1], [n for n in sorted(P) if P[n]['sheet'] == z]) + v[3:] for z, v in ZONE.items()}
TEAM = {z: ZONE[z][2] for z in ZONE}
PAD = C['pad']
TYPE = {'real': ('누리호 참여 확인', 'tag'), 'aero': ('항공우주 기업 · 수업용 연결', 'tag p'), 'similar': ('닮은 기술 지역 기업', 'tag g'), 'inst': ('공공 시험기관', 'tag g'), 'fictional': ('가상 업체 (수업용)', 'tag o')}

# ================= SLIDES =================
# 1 Cover
page(f'''<img src="{A}launch.jpg" style="position:absolute;inset:0;width:1280px;height:720px;object-fit:cover">
<div style="position:absolute;inset:0;background:linear-gradient(90deg,#030A1Ff2 0%,#030A1Fcc 45%,#030A1F22 100%)"></div>
<div style="position:absolute;left:72px;top:150px;color:#fff">
<div class="en" style="font-size:16px;font-weight:700;color:#38D0F5">HAMSTER ROBOT CREATIVE PROJECT</div>
<div style="font-size:84px;font-weight:900;letter-spacing:-0.05em;line-height:1.08;margin-top:18px">경남 로켓<br>발사 작전</div>
<div style="width:72px;height:4px;background:#38D0F5;margin:30px 0 24px"></div>
<div style="font-size:22px;line-height:1.6;color:#D6E0F2">햄스터봇 택배로봇이 경남 곳곳의 로켓 부품 36개를<br>고흥 나로우주센터 발사대로 옮기면, 인공위성을 실은 로켓이 우주로 날아갑니다.</div>
<div style="font-size:16px;color:#9FB0CF;margin-top:40px">초등학교 5·6학년 · 엔트리 블록코딩 · 4차시<br>진해도천초등학교 · 거제삼룡초등학교</div></div>''', dark=True, foot=False)

# 2 Contents
items = [(f'{i:02d}', SEC[i]) for i in range(1, 7)]
inner = '<div class="body" style="top:180px"><div class="grid" style="grid-template-columns:repeat(3,1fr);grid-template-rows:1fr 1fr">'
desc = {1: '미션 이야기, 누리호와 경남, 로켓 구조와 인공위성', 2: '4인·3인 모둠, 디자이너와 개발자, 준비물과 안전', 3: '6구역 전체 지도, 그리는 순서, 구역별 꾸미기',
        4: '조사 방법, 부품 리포트, 모둠별 부품 카드', 5: '엔트리 코딩 단계, 바닥 센서, 경로 계획서, 전자칠판', 6: '차시별 흐름, 발사 규칙, 카운트다운, 돌아보기'}
for i, t in items:
    inner += f'<div class="card"><div class="en" style="font-size:34px;font-weight:800;color:#38D0F5">{i}</div><div class="ct" style="font-size:24px">{t}</div><div class="cx">{desc[int(i)]}</div></div>'
page(inner + '</div></div>', dark=True, kicker='CONTENTS', title='목차')

# ---- PART 1
section(1, '프로젝트 소개', '우리는 왜 로켓 부품을 배달할까요?\n진짜 경남 기업과 누리호 이야기에서 출발합니다.')
page(f'''<div class="body" style="top:160px;display:grid;grid-template-columns:1.25fr 1fr;gap:28px">
<div class="card" style="padding:34px 36px;border-left:5px solid #0B5FD7"><div class="num">MISSION BRIEFING</div>
<div style="font-size:22px;line-height:1.85;margin-top:16px;color:#1E2F4F">“경남 곳곳의 부품 업체에서 누리호 같은 로켓의 부품 36개가 완성됐다!<br>그런데 택배 트럭이 모두 멈춰 버렸다.<br><br>우리 모둠의 <b style="color:#0B5FD7">햄스터봇 택배로봇 2대</b>가 부품을 <b style="color:#0B5FD7">고흥 나로우주센터 발사대</b>까지 배달해야 한다. 부품이 하나씩 도착할 때마다 전자칠판의 로켓이 조립되고, 36개가 모두 모이면 <b style="color:#0B5FD7">인공위성을 실은 로켓</b>이 우주로 발사된다!”</div></div>
<div class="grid" style="grid-template-rows:repeat(4,1fr);gap:12px">
{''.join(f'<div class="card" style="padding:14px 20px;display:flex;align-items:center;gap:18px"><div class="en" style="font-size:26px;font-weight:800;color:#0B5FD7;width:44px">{a}</div><div><div style="font-size:22px;font-weight:900">{b}</div><div style="font-size:16px;color:#5A6B85">{c}</div></div></div>' for a,b,c in [('01','조사','우리 구역 부품을 만드는 진짜 경남 회사 찾기'),('02','지도','전지에 우리 구역 지도 그리고 꾸미기'),('03','코딩','햄스터봇 2대가 업체에서 발사대까지 가게 만들기'),('04','발사','36개 부품을 모아 인공위성 발사!')])}
</div></div>''', sec=1, title='미션 이야기', lead='선생님이 읽어 주세요')

page('<div class="body">' + cards([
    ('2026. 10', '누리호 5차 발사', '경남 기업 11곳이 부품과 시험에 참여했어요.'),
    ('GOHEUNG', '고흥 나로우주센터', '우리나라 유일의 우주발사장(2009년 6월 개장). 누리호가 여기서 발사돼요.'),
    ('SACHEON', '사천', '우주항공청(2024년 5월 개청)이 있고, KAI가 누리호를 총조립해요.'),
    ('CHANGWON', '창원', '한화에어로스페이스가 누리호 75톤 엔진을 만들었어요.')], 4, 250) +
    '<div class="card" style="margin-top:20px;background:#061433;color:#fff;border:none;display:flex;align-items:center;gap:22px;padding:22px 28px"><div class="en" style="color:#38D0F5;font-weight:800;font-size:15px">POINT</div><div style="font-size:19px;line-height:1.6">우리 발사대는 진짜 누리호처럼 <b style="color:#38D0F5">고흥 나로우주센터</b>예요. 부품 36개 중 23개는 실제 경남 기업·기관과, 13개는 경남 곳곳의 <b style="color:#38D0F5">가상 업체</b>와 연결되어 있어요. 어떤 곳인지는 여러분이 직접 조사해서 찾아요.</div></div></div>',
    sec=1, title='진짜 이야기: 누리호와 경남', lead='우리가 만드는 로켓은 진짜 경남 기업들의 이야기에서 출발해요')

# Rocket structure (new)
ZN = {'fairing': ('페어링', '#0B5FD7'), 'payload': ('인공위성·탑재체', '#38D0F5'), 'avionics': ('전자장비·항법', '#7048E8'), 'tank2': ('동체·2단 탱크', '#0B5FD7'),
      'engine2': ('2·3단 엔진', '#FF6B2C'), 'interstage': ('단 연결·분리', '#7048E8'), 'tank1': ('1단 추진제 탱크', '#0B5FD7'), 'engine': ('엔진 계통', '#FF6B2C'),
      'fins': ('꼬리 날개', '#2B8A3E'), 'nozzle': ('1단 엔진·노즐', '#FF6B2C')}
ZP = {}
for n in sorted(P): ZP.setdefault(P[n]['zone'], []).append(n)
def rocket_svg():
    s = '<svg width="200" height="500" viewBox="0 0 200 500" xmlns="http://www.w3.org/2000/svg" style="position:absolute;left:180px;top:0">'
    s += '<path d="M100 6 C68 46 60 76 60 104 L140 104 C140 76 132 46 100 6Z" fill="#fff" stroke="#0D1B33" stroke-width="3"/>'
    s += '<rect x="78" y="58" width="44" height="34" rx="4" fill="#38D0F5" opacity=".35" stroke="#0B5FD7" stroke-dasharray="4 3"/>'
    s += '<rect x="60" y="104" width="80" height="22" fill="#D9D0FF" stroke="#0D1B33" stroke-width="3"/>'
    s += '<rect x="60" y="126" width="80" height="84" fill="#fff" stroke="#0D1B33" stroke-width="3"/>'
    s += '<rect x="56" y="210" width="88" height="18" fill="#AFC2DD" stroke="#0D1B33" stroke-width="3"/>'
    s += '<rect x="56" y="228" width="88" height="160" fill="#fff" stroke="#0D1B33" stroke-width="3"/>'
    s += '<text x="100" y="300" text-anchor="middle" font-size="15" font-weight="900" fill="#0B5FD7" font-family="Noto Sans KR" writing-mode="tb">경남호</text>'
    s += '<path d="M56 330 L20 400 L56 392Z M144 330 L180 400 L144 392Z" fill="#2B8A3E" stroke="#0D1B33" stroke-width="3"/>'
    s += '<path d="M72 388 L128 388 L140 426 L60 426Z" fill="#8090A8" stroke="#0D1B33" stroke-width="3"/>'
    s += '<path d="M72 428 Q100 486 128 428Z" fill="#FF6B2C" opacity=".85"/>'
    return s + '</svg>'
callouts = [(28, 'L', 'fairing'), (76, 'R', 'payload'), (115, 'L', 'avionics'), (150, 'R', 'tank2'), (192, 'L', 'engine2'), (219, 'R', 'interstage'),
            (290, 'L', 'tank1'), (330, 'R', 'engine'), (378, 'L', 'fins'), (430, 'R', 'nozzle')]
cl = ''
for y, side, z in callouts:
    nm, col = ZN[z]
    nums = ''.join(f'<span style="display:inline-flex;min-width:24px;height:24px;padding:0 4px;border-radius:12px;background:{col};color:#fff;font:800 12px Montserrat;align-items:center;justify-content:center;margin:0 2px">{n}</span>' for n in ZP[z])
    lab = f'<div style="font-size:15px;font-weight:900">{nm}</div><div style="margin-top:3px">{nums}</div>'
    if side == 'L':
        cl += f'<div style="position:absolute;right:{560-210}px;top:{y-22}px;text-align:right;white-space:nowrap">{lab}</div><div style="position:absolute;left:212px;top:{y}px;width:{[0,40][1]}px;height:2px;background:#0D1B3355"></div>'
    else:
        cl += f'<div style="position:absolute;left:372px;top:{y-22}px;white-space:nowrap">{lab}</div><div style="position:absolute;left:328px;top:{y}px;width:40px;height:2px;background:#0D1B3355"></div>'
page(f'''<div class="body" style="top:170px;display:grid;grid-template-columns:600px 1fr;gap:24px">
<div style="position:relative;height:500px">{rocket_svg()}{cl}</div>
<div class="grid" style="grid-template-rows:auto auto auto;gap:14px;align-content:start">
<div class="card" style="padding:16px 20px"><div class="num">PAYLOAD</div><div class="ct" style="font-size:21px;margin:4px 0 6px">우리 로켓의 짐: 인공위성</div><div class="cx" style="font-size:16.5px;line-height:1.5">로켓의 목적은 인공위성을 우주 궤도에 올려놓는 것이에요. 맨 위 페어링이 위성을 감싸 지키다가, 우주에 가면 열려서 위성을 내보내요.</div></div>
<div class="card" style="padding:16px 20px"><div class="num">STAGES</div><div class="ct" style="font-size:21px;margin:4px 0 6px">3단으로 된 로켓</div><div class="cx" style="font-size:16.5px;line-height:1.5">누리호는 3단 로켓이에요. 연료를 다 쓴 아래 단은 분리 장치로 떼어 내고, 가벼워진 위 단의 엔진이 다시 불을 뿜어요.</div></div>
<div class="card" style="padding:16px 20px"><div class="num">GUIDANCE</div><div class="ct" style="font-size:21px;margin:4px 0 6px">길을 찾는 두뇌</div><div class="cx" style="font-size:16.5px;line-height:1.5">관성항법장치와 위성 항법 수신기가 로켓의 위치를 알려 주고, 안테나가 지상으로 소식을 보내요.</div></div>
</div></div>''', sec=1, title='로켓의 구조와 36개 부품', lead='번호는 부품 번호예요. 강사가 버튼을 누를 때마다 그 자리가 채워져요 (수업용 단순 그림)')

# Roadmap
L = [('LESSON 1', '미션 시작! 부품 업체를 찾아라', ['구역 배정과 역할 정하기', '부품 업체 조사와 발표', '디자이너: 전지에 격자', '개발자: 햄스터봇 2대 연결, 기본 이동']),
     ('LESSON 2', '우리 구역 지도 만들기', ['디자이너: 경계, 바다, 도로 테이프', '공장 그림과 꾸미기', '개발자: 라인 따라가기', '교차로에서 멈추고 돌기']),
     ('LESSON 3', '택배 경로 설계와 리허설', ['6장 이어 붙이기', '경로 계획서 쓰기', '배달 코드 만들기', '리허설과 기록']),
     ('LESSON 4', '경남 로켓 발사!', ['부품 6개 배달 (로봇 1대당 3개)', '전자칠판 로켓 조립', '카운트다운과 발사', '돌아보기'])]
inner = '<div class="body" style="top:180px"><div style="position:absolute;left:0;right:0;top:22px;height:2px;background:#0B5FD7"></div><div class="grid" style="grid-template-columns:repeat(4,1fr)">'
for i, (a, b, c) in enumerate(L):
    inner += f'<div><div style="width:46px;height:46px;border-radius:50%;background:{"#0B5FD7" if i<3 else "#FF6B2C"};color:#fff;font:800 18px Montserrat;display:flex;align-items:center;justify-content:center;position:relative">{i+1}</div><div class="card" style="margin-top:18px;height:300px"><div class="num">{a}</div><div class="ct">{b}</div><ul class="l">' + ''.join(f'<li style="font-size:18px">{x}</li>' for x in c) + '</ul></div></div>'
page(inner + '</div></div>', sec=1, title='프로젝트 로드맵', lead='반마다 2주 동안 4차시 (차시당 80분, 40분 수업이면 8교시로 나눠 운영)')

page('<div class="body">' + cards([
    ('MAP', '경남 지도 (전지 6장)', '세로로 세운 전지 6장을 가로 3장 × 세로 2장으로 이어요.\n완성 크기 2.36m × 2.18m\n축척 약 1:66,000 (1km ≈ 1.5cm)\n도로는 폭 2cm 검은 절연테이프'),
    ('ROBOT', '햄스터봇 택배로봇', '엔트리 블록코딩으로 움직여요.\n바닥 센서로 검은 도로를 따라가요.\n교차로에서 멈추고 방향을 바꿔요.\n12대 중 모둠마다 2대, 부품 6개를 배달해요.'),
    ('SCREEN', '전자칠판 로켓', '부품이 발사대에 도착하면 선생님이 눈으로 확인하고 부품 버튼을 눌러요.\n로켓이 한 부품씩 조립되고, 36개가 모이면 카운트다운과 함께 발사!')], 3, 330) +
    '<div style="text-align:center;margin-top:18px;font-size:22px;font-weight:900;color:#0B5FD7">6모둠 × 부품 6개 = 36개 부품 → 로켓 1대 발사</div></div>', sec=1, title='우리가 함께 만드는 것')

# ---- PART 2
section(2, '모둠과 역할', '한 반을 6모둠으로 나누고, 모둠마다 경남 1개 구역을 맡아요.\n디자이너는 지도를, 개발자는 코드를 책임져요.')
page('''<div class="body" style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
<div class="grid" style="grid-template-rows:1fr 1fr;gap:16px">
<div class="card" style="border-top:5px solid #0B5FD7"><div class="num">BASIC</div><div class="ct" style="font-size:28px">4인 모둠</div><div class="cx" style="font-size:19px">디자이너 2명 + 개발자 2명</div></div>
<div class="card" style="border-top:5px solid #38D0F5"><div class="num">OPTION</div><div class="ct" style="font-size:28px">3인 모둠도 가능</div><div class="cx" style="font-size:19px">디자이너 1명 + 개발자 2명</div></div></div>
<div><table><tr><th>반 인원</th><th>4인 모둠</th><th>3인 모둠</th><th>모둠 수</th></tr>
<tr><td>24명</td><td>6개</td><td>-</td><td>6모둠</td></tr><tr><td>23명</td><td>5개</td><td>1개</td><td>6모둠</td></tr>
<tr><td>22명</td><td>4개</td><td>2개</td><td>6모둠</td></tr><tr><td>21명</td><td>3개</td><td>3개</td><td>6모둠</td></tr></table>
<div class="cx" style="margin-top:18px;font-size:18px">모둠 번호 = 맡을 구역 번호 (1모둠 → 1구역 … 6모둠 → 6구역)<br>구역마다 부품이 6개라서 모둠마다 6개를 배달해요.<br>햄스터봇 2대(1호, 2호)가 3개씩 나눠 맡아요.</div></div></div>''', sec=2, title='모둠 나누기')

page('''<div class="body" style="display:grid;grid-template-columns:1fr 1fr;gap:22px;bottom:140px">
<div class="card" style="border-top:5px solid #FF6B2C"><div class="num" style="color:#FF6B2C">DESIGNER</div><div class="ct">디자이너 · 지도 담당</div>
<div style="font-weight:900;margin-top:6px">디자이너 A · 지도 팀장</div><div class="cx">확대 도안 읽기, 10cm 격자, 시군 경계와 해안선, 도로 테이프</div>
<div style="font-weight:900;margin-top:12px">디자이너 B · 꾸미기와 기록</div><div class="cx">공장 그림과 부품 번호, 지역 명소 꾸미기, 조사 결과와 리포트 정리</div></div>
<div class="card" style="border-top:5px solid #0B5FD7"><div class="num">DEVELOPER</div><div class="ct">개발자 · 코딩 담당</div>
<div style="font-weight:900;margin-top:6px">개발자 A · 햄스터봇 1호</div><div class="cx">1호 엔트리 코드: 이동, 회전, 라인 따라가기, 교차로 판단, 부품 3개 배달 코드</div>
<div style="font-weight:900;margin-top:12px">개발자 B · 햄스터봇 2호</div><div class="cx">2호 연결과 코드, 나머지 부품 3개 배달, 시험 기록과 경로 계획서</div></div></div>
<div class="card" style="position:absolute;left:64px;right:64px;bottom:70px;background:#061433;color:#fff;border:none;padding:18px 26px;font-size:19px;line-height:1.55"><b style="color:#38D0F5">3인 모둠</b> &nbsp;디자이너 1명이 지도 그리기와 꾸미기를 모두 맡아요. 2차시 도로 테이프와 3차시 지도 이어 붙이기는 개발자 B가 10분 정도 함께 도와요. 업체 조사와 부품 리포트는 모두 함께 해요.</div>''',
     sec=2, title='역할 나누기', lead='조사와 부품 리포트는 모둠 모두가 함께 해요')

page('<div class="body">' + cards([
    ('TEACHER', '선생님 준비물', '전자칠판(로켓 조립 화면, 6구역 지도)\n햄스터봇 12대(모둠당 2대) 충전, 동글, 엔트리 연결 프로그램\n반마다 전지 6장, 검은 절연테이프(폭 2cm)\n인쇄: 전체 지도 A3, 구역 도안 A4, 조사 카드, 부품 카드, 근거 자료집'),
    ('STUDENT', '모둠 준비물', '노트북 또는 태블릿 1~2대\n30cm 자, 연필, 사인펜, 색연필(연한 색)\n가위, 풀, 부품 카드\n모둠 이름표'),
    ('SAFETY', '안전 약속', '햄스터봇이 책상 끝에서 떨어지지 않게 지켜요.\n지도 위를 걸을 때는 신발을 벗어요.\n가위와 테이프 커터는 조심해서 써요.\n검색할 때는 뉴스와 회사 누리집만 열어요.')], 3, 400) + '</div>',
    sec=2, title='준비물과 안전 약속')

# ---- PART 3
section(3, '경남 지도 만들기', '전지 6장을 이어 2.36m × 2.18m 크기의 경남 지도를 만들어요.\n모둠마다 한 구역씩 맡아 그리고 꾸며요.')
page(f'''<img src="{A}map_full.jpg" style="position:absolute;left:64px;top:118px;height:560px;width:608px;object-fit:contain;background:#fff;border:1px solid #D8E1EE">
<div style="position:absolute;left:700px;top:118px;right:64px">
<div class="card" style="padding:18px 22px"><div class="num">LEGEND</div><div class="ct">지도 읽는 법</div><ul class="l" style="font-size:17px">
<li><b>고흥 발사대</b>: 4구역 왼쪽 아래 바다 (실제 나로우주센터는 서남쪽 약 50km)</li><li>아이콘 번호 = 부품 번호 1~36</li>
<li><span style="color:#E8590C;font-weight:700">빨강</span> 누리호 참여가 기사로 확인된 회사</li>
<li><span style="color:#1C7ED6;font-weight:700">파랑</span> 항공우주 회사 (부품은 수업용 연결)</li>
<li><span style="color:#7048E8;font-weight:700">보라</span> 닮은 기술 지역 회사 · <span style="color:#2B8A3E;font-weight:700">초록</span> 시험기관 · <span style="color:#868E96;font-weight:700">회색</span> 가상 업체</li>
<li>검은 선 = 햄스터봇 도로 (2cm 테이프)</li><li>주황 동그라미 = 이웃 구역과 만나는 연결점 1~12</li></ul></div>
<div class="card" style="margin-top:14px"><div class="num">OUR SCHOOL</div><div class="cx">진해도천초: 6구역 (창원 진해)<br>거제삼룡초: 거제 (5·6구역)</div></div></div>''',
     sec=3, title='경남 전체 지도와 6구역', foot=False)

rows = ''
for z in range(1, 7):
    nm, sg, parts, *_ , col = ZONE[z]
    pt = ' · '.join(f'<b>{n}</b> {short(P[n])}' for n in parts) + (' · <b style="color:#FF6B2C">고흥 발사대(바다 쪽)</b>' if z == 4 else '')
    tm = f'{z}모둠'
    rows += f'<tr><td><span class="zone" style="background:{col}"></span>{z}구역 {nm}</td><td>{sg}</td><td>{pt}</td><td>{tm}</td></tr>'
page(f'<div class="body" style="top:170px"><table style="font-size:15px"><tr><th style="width:140px">구역</th><th style="width:220px">주요 시군</th><th>부품 6개</th><th style="width:90px">모둠</th></tr>{rows}</table></div>',
     sec=3, title='6구역과 부품 한눈에 보기', lead='어떤 회사가 만드는지는 조사해서 찾아요!')

steps = [('01', '전지를 세로로 놓고 아래쪽에 구역 번호를 크게 써요'), ('02', '연필로 10cm 격자 (가로 7칸 + 8.8cm, 세로 10칸 + 9.1cm)'), ('03', '확대 도안의 칸을 보며 시군 경계를 한 칸씩 옮겨 그려요'),
         ('04', '시군 경계는 사인펜 점선, 해안선은 실선, 바다는 연한 파랑'), ('05', '도로는 폭 2cm 검은 절연테이프 (교차로는 겹치지 말고 맞대기)'), ('06', '업체 6곳 그림과 부품 번호, 연결점 번호를 크게 표시'), ('07', '명소와 특산물로 꾸미기 (도로 위는 비워 두기)')]
inner = '<div class="body" style="display:grid;grid-template-columns:1.5fr 1fr;gap:24px"><div class="card" style="padding:16px 24px">'
for a, b in steps:
    inner += f'<div style="display:flex;gap:16px;align-items:center;padding:10px 0;border-bottom:1px solid #EDF1F7"><span class="en" style="font-weight:800;color:#0B5FD7;font-size:18px">{a}</span><span style="font-size:20px">{b}</span></div>'
inner += '</div><div class="card" style="background:#FFF4EE;border-color:#FFD3BF"><div class="num" style="color:#FF6B2C">CAUTION</div><div class="ct">센서가 헷갈려요!</div><div class="cx">바다와 경계선을 진하게 칠하면 햄스터봇 바닥 센서가 도로로 착각해요.<br><br>연한 색으로 칠하고, <b>검은색은 도로에만</b> 써요.<br><br>도로는 연결점에서 전지 끝까지 꼭 이어 붙여요.</div></div></div>'
page(inner, sec=3, title='디자이너: 지도 그리는 순서', lead='모든 구역이 같은 순서로 그려요')

for z in range(1, 7):
    nm, sg, parts, conns, nb, deco, col = ZONE[z]
    must = ''.join(f'<li style="font-size:16.5px;margin-bottom:4px"><b>{n}</b> {short(P[n])} <span style="color:#5A6B85">({sigun(P[n])})</span></li>' for n in parts)
    if z == 4: must += '<li style="font-size:16.5px;margin-bottom:4px"><b style="color:#FF6B2C">고흥 발사대</b>: 왼쪽 아래 바다, “실제 나로우주센터는 서남쪽 약 50km” 화살표</li>'
    must += f'<li style="font-size:16.5px;margin-bottom:4px">도로와 교차로 · 연결점 {", ".join(map(str, conns))}번</li>'
    page(f'''<img src="{A}zone{z}.jpg" style="position:absolute;left:64px;top:44px;height:620px;width:470px;object-fit:contain;background:#fff;border:1px solid #D8E1EE">
<div style="position:absolute;left:570px;top:44px;right:64px">
<div style="display:flex;align-items:center;gap:12px"><span class="en" style="font-size:13px;font-weight:700;color:#0B5FD7">03</span><div class="kbar"></div><div class="kicker">경남 지도 만들기 · {z}모둠 담당</div></div>
<div style="font-size:40px;font-weight:900;letter-spacing:-0.03em;margin-top:8px"><span class="zone" style="width:22px;height:22px;background:{col}"></span>{z}구역 {nm}</div>
<div style="font-size:17px;color:#5A6B85;margin-top:4px">{sg}</div>
<div class="card" style="margin-top:14px;padding:14px 20px"><div class="num">MUST DRAW · 업체 6곳</div><ul class="l" style="margin-top:8px">{must}</ul></div>
<div class="card" style="margin-top:12px;padding:14px 20px"><div class="num" style="color:#FF6B2C">DECORATE</div><ul class="l" style="margin-top:6px">{"".join(f"<li style=font-size:16.5px;margin-bottom:4px>{d}</li>" for d in deco)}</ul></div></div>''', foot=False)

# ---- PART 4
section(4, '부품 조사와 리포트', '조사 카드의 질문과 힌트로 진짜 경남 회사를 찾고,\n“(가상)” 업체는 그 지역의 자랑거리를 조사해요.')
page('<div class="body" style="bottom:200px">' + cards([
    ('STEP 01', '질문 읽기', '조사 카드의 질문을 모둠이 함께 읽어요.'), ('STEP 02', '검색하기', '힌트 검색어로 시작하고, 안 나오면 말을 바꿔요.'),
    ('STEP 03', '확인하기', '뉴스 기사와 회사 누리집만 증거로 써요. 광고와 블로그는 안 돼요.'), ('STEP 04', '기록하기', '회사, 시군, 만드는 것, 신문 이름과 날짜를 적어요. (가상) 카드는 읍면과 자랑거리를 적어요.')], 4) +
    '</div><div class="card" style="position:absolute;left:64px;right:64px;bottom:70px;height:116px;border-left:5px solid #0B5FD7;display:flex;flex-direction:column;justify-content:center"><div class="num">PRESENTATION</div><div style="font-size:19px;margin-top:6px">“우리 구역의 <b>○○○(회사)</b>는 <b>○○시</b>에 있고, 로켓의 <b>○○○</b>을(를) 만들어요. 우리는 <b>○○신문 ○○년 ○월</b> 기사에서 확인했어요.”</div></div>',
    sec=4, title='부품 업체 조사하기', lead='질문 → 검색 → 확인 → 기록')

L1 = [('01', '부품 번호와 이름', ''), ('02', '로켓에서 하는 일', '내 말로 한두 문장'), ('03', '만든 회사', ''), ('04', '회사 위치', '시군, 지도 구역 번호'), ('05', '증거 (출처)', '기사 제목, 신문 이름, 날짜')]
L2 = [('06', '진짜 로켓 부품일까?', '누리호 참여 / 항공우주 회사 / 닮은 기술 / 시험기관 / 가상 업체'), ('07', '발사대까지 배달 경로', '업체 → 지나는 도시 → 연결점 번호 → 고흥 발사대'), ('08', '새로 알게 된 점, 궁금한 점', ''), ('09', '부품 그림', '지도에도 붙여요')]
def rl(L):
    return ''.join(f'<div style="display:flex;gap:14px;padding:12px 0;border-bottom:1px solid #EDF1F7"><span class="en" style="font-weight:800;color:#0B5FD7;font-size:18px">{a}</span><div><div style="font-size:21px;font-weight:700">{b}</div>{f"<div style=font-size:17px;color:#5A6B85>{c}</div>" if c else ""}</div></div>' for a, b, c in L)
page(f'<div class="body" style="display:grid;grid-template-columns:1fr 1fr;gap:22px"><div class="card" style="padding:14px 24px">{rl(L1)}</div><div class="card" style="padding:14px 24px">{rl(L2)}</div></div>',
     sec=4, title='부품 상세 리포트 쓰기', lead='모둠마다 부품 6개, 4명이 나눠서 한 장씩 써요')

for t, pr in TEAM.items():
  for half in range(2):
    inner = '<div class="body" style="top:150px;display:grid;grid-template-columns:repeat(3,1fr);gap:18px">'
    for n in pr[half * 3:(half + 1) * 3]:
        p = P[n]
        fic = p['type'] == 'fictional'
        inner += f'''<div class="card" style="padding:0;overflow:hidden;display:flex;flex-direction:column">
<div style="display:flex;gap:14px;align-items:center;padding:14px 18px;border-bottom:1px solid #D8E1EE;background:#F8FAFD">
<img src="{A}part{n}.jpg" style="width:86px;height:72px;object-fit:contain;background:#fff;border:1px solid #E3E9F2;border-radius:4px">
<div><div class="num" style="font-size:14px">PART {n:02d} · {sigun(p)}</div><div style="font-size:19px;font-weight:900;margin-top:4px;line-height:1.25">{e(p["part"])}</div>{'<span class="tag o" style="margin-top:6px">가상 업체</span>' if fic else ''}</div></div>
<div style="padding:14px 18px;font-size:16px;line-height:1.5">
<div style="font-weight:900;color:#0B5FD7;font-size:14px">하는 일</div><div>{e(p["kid_role"])}</div>
<div style="font-weight:900;color:#0B5FD7;font-size:14px;margin-top:10px">조사 질문</div><div>{e(p["question"])}</div>
<div style="font-weight:900;color:#FF6B2C;font-size:14px;margin-top:10px">힌트</div><div>{e(p["hint"])}</div></div></div>'''
    page(inner + '</div>', sec=4, title=f'{t}모둠이 찾을 부품 ({half + 1}/2)', lead=f'{t}구역 · 부품 {", ".join(map(str, pr))}')

page('<div class="body"><table><tr><th style="width:170px">평가 요소</th><th>잘함</th><th>보통</th><th>노력 필요</th></tr>'
     '<tr><td>정보 조사</td><td>맡은 업체와 부품, 출처를 스스로 찾는다</td><td>힌트를 받고 찾는다</td><td>교사가 자료를 보여 준 뒤 정리한다</td></tr>'
     '<tr><td>부품 리포트</td><td>9개 항목을 자기 말로 채우고 출처를 밝힌다</td><td>대부분 채우지만 출처가 빠진다</td><td>도움을 받아 일부를 채운다</td></tr>'
     '<tr><td>지도 제작</td><td>축척과 연결점을 맞춰 정확히 그리고 꾸민다</td><td>대체로 맞지만 일부 어긋난다</td><td>도움을 받아 완성한다</td></tr>'
     '<tr><td>코딩</td><td>교차로 판단을 넣어 배달을 스스로 성공한다</td><td>몇 번 고쳐서 성공한다</td><td>도움을 받아 성공한다</td></tr>'
     '<tr><td>협력</td><td>역할을 지키며 다른 역할도 돕는다</td><td>자기 역할을 해낸다</td><td>역할 수행에 도움이 필요하다</td></tr></table></div>',
     sec=4, title='평가 기준 (관찰)', lead='차시마다 관찰하고 4차시 돌아보기에서 함께 확인해요')

# ---- PART 5
section(5, '코딩과 배달', '엔트리 블록코딩으로 햄스터봇 택배로봇을 움직여요.\n바닥 센서로 검은 도로를 따라 발사대까지!')
CS = [('LESSON 1', '기본 이동', '엔트리에 햄스터봇 연결\n앞으로 이동, 왼쪽·오른쪽 돌기\n책상 위 ㄱ자 길 완주'),
      ('LESSON 2', '라인 따라가기', '바닥 센서 값 확인\n검은 선 따라가기\n교차로에서 멈추고 돌기'),
      ('LESSON 3', '배달 코드', '경로 계획서대로\n교차로마다 직진·왼쪽·오른쪽\n업체 → 고흥 발사대 리허설'),
      ('LESSON 4', '본 미션', '로봇 1대당 부품 3개 배달\n부품당 기회 3번\n코드는 모둠 이름으로 저장')]
page('<div class="body">' + cards(CS, 4, 330) + '<div style="margin-top:16px;font-size:18px;color:#5A6B85;text-align:center">연결이 안 되면 동글 페어링을 확인해요 · 책상 끝에서 떨어지지 않게 조심!</div></div>', sec=5, title='개발자: 엔트리 코딩 단계', lead='차시마다 한 단계씩 올라가요')

page('''<div class="body" style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
<div class="card"><div class="num">SENSOR</div><div class="ct">바닥 센서는 이렇게 봐요</div>
<svg width="460" height="210" viewBox="0 0 460 210"><rect x="0" y="0" width="460" height="210" fill="#F3F6FA"/>
<rect x="190" y="0" width="80" height="210" fill="#111"/><rect x="0" y="130" width="460" height="0" fill="#111"/>
<rect x="160" y="70" width="140" height="90" rx="22" fill="#fff" stroke="#0B5FD7" stroke-width="4"/>
<circle cx="205" cy="148" r="9" fill="#FF6B2C"/><circle cx="255" cy="148" r="9" fill="#FF6B2C"/>
<text x="60" y="190" font-size="14" font-family="Noto Sans KR" fill="#0D1B33">왼쪽 센서</text><text x="330" y="190" font-size="14" font-family="Noto Sans KR" fill="#0D1B33">오른쪽 센서</text></svg>
<div class="cx" style="margin-top:8px">검은색 위에서는 값이 작고, 흰 종이 위에서는 값이 커요. 두 센서가 선 양쪽 끝을 보며 방향을 고쳐요.</div></div>
<div class="card"><div class="num">LOGIC</div><div class="ct">교차로 판단 순서</div><ul class="l">
<li>선을 따라 앞으로 가요</li><li>왼쪽·오른쪽 센서가 <b>모두 검정</b>이면 교차로!</li><li>멈추고, 계획서에 적은 방향(직진·왼쪽·오른쪽)으로 돌아요</li>
<li>교차로 개수를 세는 변수를 1 늘려요</li><li>마지막 교차로를 지나면 발사대에서 멈춰요</li></ul>
<div class="cx" style="margin-top:12px;font-size:16px">센서 값의 기준(예: 50)은 교실 조명에 따라 달라요. 1·2차시에 직접 재서 정해요.</div></div></div>''',
     sec=5, title='바닥 센서와 교차로 판단', lead='라인 따라가기의 원리를 먼저 이해해요')

page('''<div class="body"><table><tr><th style="width:100px">순서</th><th>지나는 곳</th><th>교차로에서 할 일</th><th style="width:90px">확인</th></tr>
<tr><td>출발</td><td>부품 ○번 업체 (○○시)</td><td>도로 위 출발 방향 맞추기</td><td>□</td></tr>
<tr><td>1</td><td>○○ 교차로</td><td>직진 / 왼쪽 / 오른쪽</td><td>□</td></tr>
<tr><td>2</td><td>연결점 ○번 (다음 구역으로)</td><td>직진 / 왼쪽 / 오른쪽</td><td>□</td></tr>
<tr><td>3</td><td>○○ 교차로</td><td>직진 / 왼쪽 / 오른쪽</td><td>□</td></tr>
<tr><td>도착</td><td><b style="color:#FF6B2C">고흥 발사대</b></td><td>멈추고 부품 내려놓기</td><td>□</td></tr></table>
<div class="cx" style="margin-top:18px;font-size:18px">지도는 6모둠이 함께 써요. 2모둠씩 번갈아 시험하고, 4모둠은 발사대와 가까우니 사천 시내 교차로를 많이 지나는 우회 경로에 도전해요.</div></div>''',
     sec=5, title='택배 경로 계획서', lead='부품마다 한 장씩, 로봇 1대당 3장 (3차시)')

BTN = ''.join(f'<div style="height:44px;border-radius:6px;background:{"#0B5FD7" if n in (1,2,3,7,12,24) else "#1B2C55"};border:1px solid #2E4A85;color:#fff;font:800 15px Montserrat;display:flex;align-items:center;justify-content:center">{n}</div>' for n in range(1, 37))
page(f'''<div style="position:absolute;left:64px;top:176px;width:640px;height:400px;background:#061433;border-radius:8px;padding:22px 26px"><div style="display:flex;justify-content:space-between;color:#fff;font-weight:900;font-size:20px"><span>부품 도착 버튼</span><span class="en" style="color:#38D0F5">6 / 36</span></div><div style="height:8px;background:#1B2C55;border-radius:4px;margin:12px 0 16px"><div style="width:16.7%;height:8px;background:#38D0F5;border-radius:4px"></div></div><div style="display:grid;grid-template-columns:repeat(9,1fr);gap:8px">{BTN}</div><div style="color:#9FB0CF;font-size:14px;margin-top:14px">예시 화면 · 파란 버튼 = 도착한 부품</div></div>
<div style="position:absolute;left:730px;right:64px;top:176px"><div class="card"><div class="num">TEACHER PC</div><div class="ct">부품이 도착하면</div><ul class="l">
<li>햄스터봇이 발사대에 도착하면 선생님이 <b>눈으로 확인</b>해요</li><li>전자칠판에서 그 <b>부품 번호 버튼</b>을 눌러요</li><li>로켓의 그 자리에 부품이 붙어요</li><li>잘못 눌렀으면 한 번 더 눌러 취소해요</li><li>36/36이 되면 발사 버튼이 켜져요</li></ul></div></div>
<div style="position:absolute;left:64px;top:550px;font-size:17px;color:#5A6B85">반마다 처음부터 새로 시작해요. 반 이름 버튼을 눌러 0/36부터 시작해요.</div>''',
     sec=5, title='전자칠판 로켓 조립 화면', lead='부품이 하나 도착할 때마다 로켓이 한 단계씩 완성돼요')

# ---- PART 6
section(6, '수업 운영과 발사', '차시별 흐름과 4차시 본 미션 규칙,\n그리고 카운트다운!')
def flow(rows):
    t = '<table><tr><th style="width:170px">단계</th><th style="width:80px">시간</th><th>활동</th></tr>'
    for a, b, c in rows: t += f'<tr><td>{a}</td><td>{b}</td><td>{c}</td></tr>'
    return '<div class="body" style="top:170px">' + t + '</table></div>'
page(flow([('미션 브리핑', '10분', '전자칠판 빈 발사대와 6구역 지도, 미션 이야기, 누리호와 경남 기업'), ('구역·역할 배정', '5분', '6모둠에 1~6구역 배정, 디자이너·개발자 정하기'),
           ('업체 조사', '25분', '조사 카드 6장을 1–2장씩 나눠 검색, 회사·시군·출처 기록'), ('발표', '10분', '모둠별 1분 발표 → 정답과 근거 확인'),
           ('역할별 활동', '25분', '디자이너: 전지 10cm 격자 / 개발자: 햄스터봇 2대 연결, ㄱ자 길'), ('정리', '5분', '찾은 업체 다시 말하기, 다음 차시 예고')]), sec=6, title='1차시 · 미션 시작! 부품 업체를 찾아라', lead='80분')
page(flow([('도입', '5분', '전자칠판에서 6구역 아웃라인과 “꼭 그릴 것” 확인'), ('전개 1', '35분', '디자이너: 시군 경계, 해안선, 바다 색칠, 도로 위치 연필 표시 / 개발자: 바닥 센서 값 확인, 라인 따라가기'),
           ('전개 2', '25분', '디자이너: 도로 테이프, 공장과 번호, 꾸미기 / 개발자: 교차로에서 멈추고 돌기'), ('전개 3', '10분', '디자이너: 이웃 구역과 연결점 맞추기 / 개발자: “2번째 교차로에서 왼쪽” 미션'),
           ('정리', '5분', '진행 상황 사진, 코드 저장, 부품 리포트 3장 완성')]), sec=6, title='2차시 · 우리 구역 지도 만들기', lead='80분')
page(flow([('도입', '5분', '6장 이어 붙이기, 연결점 번호끼리 도로가 맞는지 확인'), ('경로 계획', '15분', '부품 6개 경로 계획서 쓰기 (로봇마다 3개)'),
           ('코드 만들기', '35분', '개발자: 계획서대로 코드 / 디자이너: 지도 보완, 경로 안내, 리포트 6장 완성. 2모둠씩 번갈아 시험'),
           ('리허설', '20분', '부품 카드를 싣고 실제 배달, 걸린 시간과 멈춘 곳 기록'), ('정리', '5분', '고칠 점 정리, 4차시 배달 순서 정하기')]), sec=6, title='3차시 · 택배 경로 설계와 리허설', lead='80분')

page('''<div class="body" style="display:grid;grid-template-columns:1.2fr 1fr;gap:22px">
<div class="card"><div class="num">RULES</div><div class="ct">본 미션 규칙</div><ul class="l">
<li>모둠마다 햄스터봇 2대가 부품 3개씩 배달해요</li><li>부품이 도착하면 선생님이 보고 전자칠판 버튼을 눌러요</li><li>부품당 기회는 3번, 실패하면 코드를 고쳐 다시!</li>
<li>3번 실패하면 선생님과 함께 수동 배달</li><li>도착 순서는 상관없어요</li></ul></div>
<div class="card" style="background:#061433;color:#fff;border:none"><div class="num" style="color:#38D0F5">TIME TABLE · 80분</div>
<div style="font-size:21px;line-height:1.9;margin-top:10px">도입 5분 · 브리핑과 배달 순서<br>점검 10분 · 마지막 코드 확인<br>본 미션 40분 · 부품 36개 배달<br>발사 10분 · 카운트다운과 발사 영상<br>돌아보기 15분</div></div></div>''',
     sec=6, title='4차시 · 경남 로켓 발사!', lead='36개 부품이 모두 모이면 발사')

page('''<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center">
<div class="en" style="font-size:20px;font-weight:800;color:#38D0F5">COUNTDOWN</div>
<div class="en" style="font-size:250px;font-weight:800;line-height:1;margin-top:10px;letter-spacing:0;background:linear-gradient(#fff,#8FD3FF);-webkit-background-clip:text;color:transparent">10</div>
<div style="font-size:26px;font-weight:700;margin-top:18px">반 전체가 함께 외쳐요: 10, 9, 8 … 3, 2, 1, 발사!</div>
<div style="font-size:17px;color:#9FB0CF;margin-top:14px">전자칠판의 발사 버튼을 누르면 카운트다운과 발사 영상이 이어져요</div></div>''', dark=True, sec=6)

qs = ['우리 구역 회사를 조사하며 새로 알게 된 것은?', '지도와 코드를 만들며 가장 어려웠던 점은? 어떻게 해결했나요?', '디자이너와 개발자는 서로 어떻게 도왔나요?', '우리 동네 가까이에서 진짜 로켓 부품이 만들어진다는 것, 어떤 생각이 드나요?']
page('<div class="body" style="display:grid;grid-template-columns:1fr 1fr;gap:18px">' + ''.join(f'<div class="card" style="display:flex;gap:16px;align-items:center"><span class="en" style="font-size:30px;font-weight:800;color:#0B5FD7">Q{i+1}</span><span style="font-size:23px;font-weight:700;line-height:1.5">{q}</span></div>' for i, q in enumerate(qs)) + '</div>',
     sec=6, title='돌아보기', lead='4차시 마무리 15분')

for sch in ['진해도천초등학교', '거제삼룡초등학교']:
    page(f'''<img src="{A}launch.jpg" style="position:absolute;inset:0;width:1280px;height:720px;object-fit:cover">
<div style="position:absolute;inset:0;background:linear-gradient(0deg,#030A1Ff5 0%,#030A1Fb3 45%,#030A1F00 75%)"></div>
<div style="position:absolute;left:0;right:0;bottom:70px;text-align:center;color:#fff">
<div class="en" style="font-size:18px;font-weight:800;color:#38D0F5">LAUNCH SUCCESS</div>
<div style="font-size:26px;font-weight:700;margin-top:12px;color:#C7D3EA">{sch} 학생 여러분</div>
<div style="font-size:50px;font-weight:900;letter-spacing:-0.03em;margin-top:10px;line-height:1.3">로켓 발사를 위해 최선을 다한<br>여러분에게 감사드립니다.</div>
<div style="font-size:40px;font-weight:900;margin-top:10px;color:#38D0F5">로켓 발사 성공 축하합니다!</div></div>''', dark=True, foot=False)

# ---- PART 7 teacher
section(7, '강사용 자료', '모둠 발표가 끝난 뒤에 보여 주세요.\n항공우주·닮은 기술 회사는 그 부품을 실제로 만들지 않고,\n가상 업체는 수업용 이야기라는 점을 꼭 짚어 주세요.')
order = [n for z in range(1, 7) for n in TEAM[z]]
for k in range(4):
    rows = ''
    for n in order[k * 9:(k + 1) * 9]:
        p = P[n]; tl, tc = TYPE[p['type']]
        rows += f'<tr><td>{n}. {e(p["part"])}</td><td>{e(p["company"])}</td><td>{e(p["sigun"])} · {p["sheet"]}구역</td><td><span class="{tc}">{tl}</span></td></tr>'
    page(f'<div class="body" style="top:170px"><table style="font-size:14px"><tr><th style="width:300px">부품</th><th>업체</th><th style="width:250px">위치</th><th style="width:210px">구분</th></tr>{rows}</table></div>',
         sec=7, title=f'정답: 부품 업체 36곳 ({k + 1}/4)', lead='근거 기사와 출처 링크는 강사용 근거 자료집에 있어요')
page('<div class="body">' + cards([
    ('NEW START', '반마다 새로 시작', '4개 반 모두 처음부터 직접 지도를 그려요. 전지 24장(반당 6장)을 준비하고, 전지 아래에 반 이름을 써서 반별로 보관해요.'),
    ('SCREEN', '전자칠판 기록', '반 이름 버튼을 눌러 0/36부터 시작해요. 반마다 기록이 따로 남아요.'),
    ('EVIDENCE', '근거 자료', '학생 카드에는 정답이 없어요. 못 찾으면 힌트 → 기사 제목 → 근거 자료집 순서로 보여 줘요.')], 3, 330) + '</div>',
    sec=7, title='반별 운영 메모')

for i, h in enumerate(pages):
    open(os.path.join(OUT, f's{i + 1:02d}.html'), 'w').write(h)
print(len(pages))
