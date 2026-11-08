"""bg/sNN.jpg(글자 없는 배경) + text.json(글자 상자) → 편집 가능한 PPTX"""
import json, re, sys
from pptx import Presentation
from pptx.util import Emu, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR, MSO_AUTO_SIZE
PX = 9525
D = json.load(open('text.json'))
prs = Presentation(); prs.slide_width = Emu(1280 * PX); prs.slide_height = Emu(720 * PX)
blank = prs.slide_layouts[6]
AL = {'center': PP_ALIGN.CENTER, 'right': PP_ALIGN.RIGHT, 'end': PP_ALIGN.RIGHT}
def rgb(c):
    v = [float(x) for x in re.findall(r'[\d.]+', c)]
    return RGBColor(*[int(x) for x in v[:3]])
for k in sorted(D):
    s = prs.slides.add_slide(blank)
    s.shapes.add_picture(f'bg/{k}.jpg', 0, 0, prs.slide_width, prs.slide_height)
    for b in D[k]:
        runs = [r for r in b['runs']]
        if not ''.join(r['t'] for r in runs).strip(): continue
        al = b['align']
        w = b['w'] * 1.12 + 8
        if al == 'center': x = b['x'] + b['w'] / 2 - w / 2
        elif al in ('right', 'end'): x = b['x'] + b['w'] - w
        else: x = b['x']
        tb = s.shapes.add_textbox(Emu(int(x * PX)), Emu(int(b['y'] * PX)), Emu(int(w * PX)), Emu(int(max(b['h'], 10) * PX)))
        tf = tb.text_frame; tf.word_wrap = False; tf.auto_size = MSO_AUTO_SIZE.NONE
        tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
        tf.vertical_anchor = MSO_ANCHOR.TOP
        fs0 = next(r['s'] for r in runs if 's' in r)
        p = tf.paragraphs[0]
        def setp(p):
            p.alignment = AL.get(al, PP_ALIGN.LEFT); p.line_spacing = Pt(round(b['lh'] * fs0 * 0.75, 1))
            p.space_before = Pt(0); p.space_after = Pt(0)
        setp(p)
        for r in runs:
            parts = r['t'].split('\n')
            for i, t in enumerate(parts):
                if i > 0: p = tf.add_paragraph(); setp(p)
                if not t or 's' not in r: continue
                for j, seg in enumerate(t.split('\v')):
                    if j > 0: p.add_line_break()
                    if not seg: continue
                    rr = p.add_run(); rr.text = seg
                    f = rr.font; f.size = Pt(round(r['s'] * 0.75 * 2) / 2); f.bold = r['b']; f.name = r['f']
                    f.color.rgb = rgb(r['c'])
                    if r.get('ls'): rr._r.get_or_add_rPr().set('spc', str(int(r['ls'] * 75)))
prs.save(sys.argv[1] if len(sys.argv) > 1 else 'slides_editable.pptx')
