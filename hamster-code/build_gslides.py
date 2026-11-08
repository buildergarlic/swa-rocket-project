"""stext.json + 배경 그림(깃허브 raw 주소) → Google Slides batchUpdate 요청 묶음(gs/bNN.json).
사용법: python3 build_gslides.py <배경 그림 주소 앞부분> [y보정(pt)]
예: python3 build_gslides.py https://raw.githubusercontent.com/OWNER/REPO/COMMIT/hamster-code/slides-bg
"""
import json, os, re, sys

BASE = sys.argv[1].rstrip('/')
YADJ = float(sys.argv[2]) if len(sys.argv) > 2 else 0.0
# 첫 줄 위치 보정(em, +는 아래로). 측정: Slides가 Noto Sans KR은 0.27em 위에, Jua는 0.12em 아래에 그림
EM_ADJ = {'Noto Sans KR': float(sys.argv[3]) if len(sys.argv) > 3 else 0.27, 'Jua': -0.12}
D = json.load(open(os.path.join(os.path.dirname(__file__) or '.', 'stext.json')))
ORDER = sorted(D.keys())
PT = 720 / 1600          # 1px = 0.45pt (16:9 기본 크기 720x405pt)
INSET = 7.2              # 글자 상자 기본 안쪽 여백(pt)
NATURAL = {'Noto Sans KR': 1.448, 'Jua': 1.25}   # 브라우저에서 line-height: normal 일 때 줄 높이(em)
SLIDES_LH = 1.2   # Google Slides 줄 간격 100% = 글자 크기의 1.2배 (두 글꼴 모두 측정값)
PREFIX = 'hb'


def col(c):
    v = [float(x) for x in re.findall(r'[\d.]+', c)][:3]
    return {'opaqueColor': {'rgbColor': {k: round(x / 255, 3) for k, x in zip(('red', 'green', 'blue'), v)}}}


def r1(x):
    return round(x, 2)


def fsize(px):
    return round(px * PT * 2) / 2


def style_of(r):
    return {'weightedFontFamily': {'fontFamily': r['f'], 'weight': r['w']}, 'bold': r['w'] >= 700,
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
        lh = b['lh'] or NATURAL[base['f']]
        L = lh / SLIDES_LH
        # 줄 간격이 100%보다 작으면 Slides가 첫 줄을 (1-L)*0.9em 만큼 올려 그림 → 그만큼 내림
        dy_px = EM_ADJ[base['f']] * base['s'] + (0.9 * (1 - L) * base['s'] if L < 1 else 0)
        R.append({'createShape': {'objectId': oid, 'shapeType': 'TEXT_BOX', 'elementProperties': {
            'pageObjectId': sid,
            'size': {'width': {'magnitude': r1(w * PT + 2 * INSET), 'unit': 'PT'}, 'height': {'magnitude': r1(hgt * PT + 2 * INSET), 'unit': 'PT'}},
            'transform': {'scaleX': 1, 'scaleY': 1, 'translateX': r1(x * PT - INSET), 'translateY': r1((y + dy_px) * PT - INSET + YADJ), 'unit': 'PT'}}}})
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
                    d['bold'] = r['w'] >= 700; f.append('bold')
                if r['c'] != base['c']:
                    d['foregroundColor'] = col(r['c']); f.append('foregroundColor')
                if r['s'] != base['s']:
                    d['fontSize'] = {'magnitude': fsize(r['s']), 'unit': 'PT'}; f.append('fontSize')
                R.append({'updateTextStyle': {'objectId': oid, 'textRange': {'type': 'FIXED_RANGE', 'startIndex': s0, 'endIndex': s1},
                                              'style': d, 'fields': ','.join(f)}})
        ps = {'lineSpacing': round(L * 100), 'spaceAbove': {'magnitude': 0, 'unit': 'PT'}, 'spaceBelow': {'magnitude': 0, 'unit': 'PT'}}
        fields = ['lineSpacing', 'spaceAbove', 'spaceBelow']
        if al in ('center', 'right', 'end'):
            ps['alignment'] = 'CENTER' if al == 'center' else 'END'; fields.append('alignment')
        R.append({'updateParagraphStyle': {'objectId': oid, 'textRange': {'type': 'ALL'}, 'style': ps, 'fields': ','.join(fields)}})
    out[sid_raw] = R

os.makedirs('gs', exist_ok=True)
for f in os.listdir('gs'):
    os.remove(os.path.join('gs', f))
skel = []
for sid_raw in ORDER:
    skel.append(out[sid_raw][0])
    json.dump(out[sid_raw][1:], open(f'gs/s{sid_raw}.json', 'w'), ensure_ascii=False, separators=(',', ':'))
skel.append({'deleteObject': {'objectId': 'p'}})
for sid_raw in ORDER:
    ids = [r[k]['objectId'] for r in out[sid_raw][1:] for k in ('createImage', 'createShape') if k in r]
    json.dump([{'deleteObject': {'objectId': i}} for i in ids], open(f'gs/del{sid_raw}.json', 'w'), separators=(',', ':'))
json.dump(skel, open('gs/skeleton.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print('slides', len(out), 'requests', sum(len(v) for v in out.values()))
for f in sorted(os.listdir('gs')):
    print(f, os.path.getsize('gs/' + f))
