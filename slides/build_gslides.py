"""text.json + bg/sNN.jpg(깃허브 URL) → Google Slides batchUpdate 요청(JSON). 슬라이드 묶음별 파일로 나눠 저장."""
import json, re, sys
D = json.load(open('text.json'))
COMMIT = sys.argv[1]; PREFIX = sys.argv[2] if len(sys.argv) > 2 else 'e'
PT = 0.75; INSET = 7.2  # Google Slides 기본 안쪽 여백(pt)
def col(c):
    v = [float(x) for x in re.findall(r'[\d.]+', c)][:3]
    return {'opaqueColor': {'rgbColor': {k: round(x / 255, 2) for k, x in zip(('red', 'green', 'blue'), v) if x}}}
def r1(x): return round(x, 1)
out = {}
for si, k in enumerate(sorted(D)):
    n = int(k[1:]); sid = f'{PREFIX}s{n:02d}'
    R = [{'createSlide': {'objectId': sid, 'insertionIndex': n - 1, 'slideLayoutReference': {'predefinedLayout': 'BLANK'}}},
         {'createImage': {'objectId': f'{sid}bg', 'url': f'https://raw.githubusercontent.com/buildergarlic/swa-rocket-project/{COMMIT}/slides/bg/{k}.jpg',
          'elementProperties': {'pageObjectId': sid, 'size': {'width': {'magnitude': 720, 'unit': 'PT'}, 'height': {'magnitude': 405, 'unit': 'PT'}},
                                'transform': {'scaleX': 1, 'scaleY': 1, 'unit': 'PT'}}}}]
    for bi, b in enumerate(D[k]):
        runs = [r for r in b['runs']]
        # 텍스트와 스타일 구간
        text = ''; spans = []
        for r in runs:
            t = r['t'].replace('\v', '\n')
            if 's' in r and t:
                spans.append((len(text), len(text) + len(t), r))
            text += t
        text = text.replace('\n\n', '\n')
        if not text.strip() or not spans: continue
        al = b['align']; w = b['w'] * 1.1 + 6
        x = b['x'] + b['w'] / 2 - w / 2 if al == 'center' else (b['x'] + b['w'] - w if al in ('right', 'end') else b['x'])
        oid = f'{sid}t{bi}'
        base = max(spans, key=lambda s: s[1] - s[0])[2]
        R.append({'createShape': {'objectId': oid, 'shapeType': 'TEXT_BOX', 'elementProperties': {'pageObjectId': sid,
            'size': {'width': {'magnitude': r1(w * PT + 2 * INSET), 'unit': 'PT'}, 'height': {'magnitude': r1(b['h'] * PT + 2 * INSET), 'unit': 'PT'}},
            'transform': {'scaleX': 1, 'scaleY': 1, 'translateX': r1(x * PT - INSET), 'translateY': r1(b['y'] * PT - INSET), 'unit': 'PT'}}}})
        R.append({'insertText': {'objectId': oid, 'text': text}})
        def st(r):
            return {'fontFamily': r['f'], 'fontSize': {'magnitude': round(r['s'] * PT * 2) / 2, 'unit': 'PT'}, 'bold': r['b'], 'foregroundColor': col(r['c'])}
        R.append({'updateTextStyle': {'objectId': oid, 'style': st(base), 'fields': 'fontFamily,fontSize,bold,foregroundColor'}})
        # 기본과 다른 구간만 덧칠 (텍스트 길이가 \n\n 정리로 줄 수 있어 위치 재계산)
        pos = 0; full = ''
        for r in runs:
            t = r['t'].replace('\v', '\n')
            seg_start = len(full); full = (full + t).replace('\n\n', '\n'); seg_end = len(full)
            if 's' in r and seg_end > seg_start and (r['b'], r['c'], r['s'], r['f']) != (base['b'], base['c'], base['s'], base['f']):
                d = {}; f = []
                if r['b'] != base['b']: d['bold'] = r['b']; f.append('bold')
                if r['c'] != base['c']: d['foregroundColor'] = col(r['c']); f.append('foregroundColor')
                if r['s'] != base['s']: d['fontSize'] = {'magnitude': round(r['s'] * PT * 2) / 2, 'unit': 'PT'}; f.append('fontSize')
                if r['f'] != base['f']: d['fontFamily'] = r['f']; f.append('fontFamily')
                R.append({'updateTextStyle': {'objectId': oid, 'textRange': {'type': 'FIXED_RANGE', 'startIndex': seg_start, 'endIndex': seg_end}, 'style': d, 'fields': ','.join(f)}})
        ps = {'lineSpacing': round(b['lh'] / 1.45 * 100), 'spaceAbove': {'magnitude': 0, 'unit': 'PT'}, 'spaceBelow': {'magnitude': 0, 'unit': 'PT'}}
        if al in ('center', 'right', 'end'): ps['alignment'] = 'CENTER' if al == 'center' else 'END'
        multi = '\n' in text.strip()
        if not multi: ps.pop('lineSpacing')
        ps.pop('spaceAbove'); ps.pop('spaceBelow')
        if ps: R.append({'updateParagraphStyle': {'objectId': oid, 'style': ps, 'fields': ','.join(ps)}})
    out[n] = R
json.dump(out, open('gslides_req.json', 'w'), ensure_ascii=False, separators=(',', ':'))
tot = sum(len(json.dumps(v, ensure_ascii=False, separators=(',', ':'))) for v in out.values())
print('total chars', tot, 'requests', sum(len(v) for v in out.values()))
