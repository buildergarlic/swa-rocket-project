"""stext.json + 배경 그림(깃허브 raw 주소) → Google Slides batchUpdate 요청 묶음(gs/bNN.json).
사용법: python3 build_gslides.py <배경 그림 주소 앞부분> [y보정(pt)]
예: python3 build_gslides.py https://raw.githubusercontent.com/OWNER/REPO/COMMIT/hamster-code/slides-bg
"""
import json, os, re, sys

BASE = sys.argv[1].rstrip('/')
YADJ = float(sys.argv[2]) if len(sys.argv) > 2 else 0.0
D = json.load(open(os.path.join(os.path.dirname(__file__) or '.', 'stext.json')))
ORDER = list(D.keys())
PT = 720 / 1600          # 1px = 0.45pt (16:9 기본 크기 720x405pt)
INSET = 7.2              # 글자 상자 기본 안쪽 여백(pt)
NATURAL = {'Noto Sans KR': 1.448, 'Jua': 1.25}   # 글꼴의 기본 줄 높이(em)
PREFIX = 'hb'


def col(c):
    v = [float(x) for x in re.findall(r'[\d.]+', c)][:3]
    return {'opaqueColor': {'rgbColor': {k: round(x / 255, 3) for k, x in zip(('red', 'green', 'blue'), v)}}}


def r1(x):
    return round(x, 2)


def fsize(px):
    return round(px * PT * 2) / 2


def style_of(r):
    return {'weightedFontFamily': {'fontFamily': r['f'], 'weight': r['w']}, 'bold': False,
            'fontSize': {'magnitude': fsize(r['s']), 'unit': 'PT'}, 'foregroundColor': col(r['c'])}


def key(r):
    return (r['f'], r['w'], r['c'], r['s'])


out = {}
for sid_raw in ORDER:
    sid = f'{PREFIX}_s{sid_raw}'
    R = [{'createSlide': {'objectId': sid, 'slideLayoutReference': {'predefinedLayout': 'BLANK'}}},
         {'createImage': {'objectId': f'{sid}_bg', 'url': f'{BASE}/{sid_raw}.jpg',
                          'elementProperties': {'pageObjectId': sid,
                                                'size': {'width': {'magnitude': 720, 'unit': 'PT'}, 'height': {'magnitude': 405, 'unit': 'PT'}},
                                                'transform': {'scaleX': 1, 'scaleY': 1, 'translateX': 0, 'translateY': 0, 'unit': 'PT'}}}}]
    for bi, b in enumerate(D[sid_raw]):
        # 글자와 스타일 구간 (UTF-16 위치 = 파이썬 길이, 한글·기호 모두 BMP)
        text = ''
        spans = []
        for r in b['runs']:
            t = r['t'].replace('\v', '\u000b')
            if 's' in r and r.get('s'):
                spans.append((len(text), len(text) + len(t), r))
            text += t
        text = re.sub(r'\n+', '\n', text)
        if not text.strip() or not spans:
            continue
        base = max(spans, key=lambda s: s[1] - s[0])[2]
        tw = b['tx1'] - b['tx0']
        w = max(b['cw'], tw) * 1.04 + 10
        al = b['align']
        if al == 'center':
            x = (b['tx0'] + b['tx1']) / 2 - w / 2
        elif al in ('right', 'end'):
            x = b['tx1'] - w
        else:
            x = b['tx0']
        y = b['ty0']
        hgt = b['ty1'] - b['ty0']
        oid = f'{sid}_t{bi}'
        R.append({'createShape': {'objectId': oid, 'shapeType': 'TEXT_BOX', 'elementProperties': {
            'pageObjectId': sid,
            'size': {'width': {'magnitude': r1(w * PT + 2 * INSET), 'unit': 'PT'}, 'height': {'magnitude': r1(hgt * PT + 2 * INSET), 'unit': 'PT'}},
            'transform': {'scaleX': 1, 'scaleY': 1, 'translateX': r1(x * PT - INSET), 'translateY': r1(y * PT - INSET + YADJ), 'unit': 'PT'}}}})
        R.append({'insertText': {'objectId': oid, 'text': text}})
        R.append({'updateTextStyle': {'objectId': oid, 'textRange': {'type': 'ALL'}, 'style': style_of(base),
                                      'fields': 'weightedFontFamily,bold,fontSize,foregroundColor'}})
        # 기본과 다른 구간 덧칠 (줄바꿈 정리 뒤 위치 다시 셈)
        full = ''
        for r in b['runs']:
            t = r['t'].replace('\v', '\u000b')
            s0 = len(full)
            full = re.sub(r'\n+', '\n', full + t)
            s1 = len(full)
            if r.get('s') and s1 > s0 and key(r) != key(base):
                d, f = {}, []
                if (r['f'], r['w']) != (base['f'], base['w']):
                    d['weightedFontFamily'] = {'fontFamily': r['f'], 'weight': r['w']}; f.append('weightedFontFamily')
                if r['c'] != base['c']:
                    d['foregroundColor'] = col(r['c']); f.append('foregroundColor')
                if r['s'] != base['s']:
                    d['fontSize'] = {'magnitude': fsize(r['s']), 'unit': 'PT'}; f.append('fontSize')
                R.append({'updateTextStyle': {'objectId': oid, 'textRange': {'type': 'FIXED_RANGE', 'startIndex': s0, 'endIndex': s1},
                                              'style': d, 'fields': ','.join(f)}})
        lh = b['lh'] or NATURAL[base['f']]
        ps = {'lineSpacing': round(lh / NATURAL[base['f']] * 100), 'spaceAbove': {'magnitude': 0, 'unit': 'PT'}, 'spaceBelow': {'magnitude': 0, 'unit': 'PT'}}
        fields = ['lineSpacing', 'spaceAbove', 'spaceBelow']
        if al in ('center', 'right', 'end'):
            ps['alignment'] = 'CENTER' if al == 'center' else 'END'; fields.append('alignment')
        R.append({'updateParagraphStyle': {'objectId': oid, 'textRange': {'type': 'ALL'}, 'style': ps, 'fields': ','.join(fields)}})
        R.append({'updateShapeProperties': {'objectId': oid, 'shapeProperties': {'autofit': {'autofitType': 'NONE'}}, 'fields': 'autofit.autofitType'}})
    out[sid_raw] = R

os.makedirs('gs', exist_ok=True)
for f in os.listdir('gs'):
    os.remove(os.path.join('gs', f))
# 슬라이드 단위로 묶음 (한 번에 보내기 좋은 크기)
cur, size, bi = [], 0, 0
def flush():
    global cur, size, bi
    if cur:
        json.dump(cur, open(f'gs/b{bi:02d}.json', 'w'), ensure_ascii=False, separators=(',', ':'))
        bi += 1
    cur, size = [], 0
for sid_raw in ORDER:
    l = len(json.dumps(out[sid_raw], ensure_ascii=False, separators=(',', ':')))
    if size + l > 26000:
        flush()
    cur.extend(out[sid_raw]); size += l
flush()
print('slides', len(out), 'batches', bi, 'requests', sum(len(v) for v in out.values()))
for f in sorted(os.listdir('gs')):
    print(f, os.path.getsize('gs/' + f))
