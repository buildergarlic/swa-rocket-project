"""썸네일(thumbs/ID.png, 1600x900)과 원본(sref/ID.png)의 글자 위치 비교.
글자 = 배경(sbg/ID.jpg)과 다른 픽셀. 상자마다 무게중심 차이(dx, dy)와 높이 차이를 낸다.
사용법: python3 qa.py ID [ID ...]
"""
import json, sys, os
import numpy as np
from PIL import Image

H = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(os.path.join(H, 'stext.json')))


def load(p):
    im = Image.open(p).convert('RGB')
    if im.size != (1600, 900):
        im = im.resize((1600, 900), Image.LANCZOS)
    return np.asarray(im).astype(np.int16)


def mask(a, bg):
    return np.abs(a - bg).sum(2) > 90


def dil(m, k=4):
    o = m.copy()
    for dy in range(-k, k + 1):
        for dx in range(-k, k + 1):
            o |= np.roll(np.roll(m, dy, 0), dx, 1)
    return o


for sid in sys.argv[1:]:
    bg = load(os.path.join(H, 'sbg', sid + '.jpg'))
    ref = mask(load(os.path.join(H, 'sref', sid + '.png')), bg)
    th = mask(load(os.path.join(H, 'thumbs', sid + '.png')), bg)
    tot_r, tot_t = ref.sum(), th.sum()
    refd, thd = dil(ref), dil(th)
    inter = (th & refd).sum()
    print(f'== {sid} ref {tot_r} thumb {tot_t} thumb-inside-ref {inter / max(tot_t, 1):.2f} ref-covered {(ref & thd).sum() / max(tot_r, 1):.2f}')
    bad = []
    for i, b in enumerate(D[sid]):
        x0, y0, x1, y1 = int(b['tx0']) - 6, int(b['ty0']) - 10, int(b['tx1']) + 6, int(b['ty1']) + 10
        x0, y0 = max(x0, 0), max(y0, 0)
        r = ref[y0:y1, x0:x1]
        t = th[y0:y1, x0:x1]
        txt = ''.join(rr['t'] for rr in b['runs'])[:24].replace('\v', '/').replace('\n', '|')
        if r.sum() < 20:
            continue
        ry, rx = np.nonzero(r)
        ty, tx = np.nonzero(t)
        # 넓힌 영역(위아래 40px)에서 썸네일 글자가 상자를 벗어났는지
        X0, Y0, X1, Y1 = max(x0 - 30, 0), max(y0 - 40, 0), min(x1 + 30, 1600), min(y1 + 40, 900)
        tw = th[Y0:Y1, X0:X1]
        rw = refd[Y0:Y1, X0:X1]
        spill = (tw & ~rw).sum() / max(r.sum(), 1)
        if len(ty) < 20:
            bad.append((i, txt, 'MISSING'))
            continue
        dy = ty.mean() - ry.mean()
        dx = tx.mean() - rx.mean()
        hr = (ry.max() - ry.min())
        ht = (ty.max() - ty.min())
        cov = len(ty) / len(ry)
        flag = abs(dy) > 4 or abs(dx) > 6 or abs(ht - hr) > 8 or spill > 0.12 or not 0.6 < cov < 1.6
        line = f'  t{i:<2} dy{dy:+6.1f} dx{dx:+6.1f} h {hr:4d}->{ht:4d} cov {cov:4.2f} spill {spill:4.2f} {txt}'
        if flag or '-v' in os.environ.get('QA', ''):
            print(line + ('  <<' if flag else ''))
