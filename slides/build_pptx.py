"""bg/sNN.jpg(글자 없는 배경) + text.json(글자 상자) → 편집 가능한 PPTX"""
import json, re, sys
from pptx import Presentation
from pptx.util import Emu, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR, MSO_AUTO_SIZE
PX = 9525
TEXT_ONLY = '--text-only' in sys.argv
sys.argv = [a for a in sys.argv if a != '--text-only']
D = json.load(open('text.json'))
prs = Presentation(); prs.slide_width = Emu(1280 * PX); prs.slide_height = Emu(720 * PX)
blank = prs.slide_layouts[6]
AL = {'center': PP_ALIGN.CENTER, 'right': PP_ALIGN.RIGHT, 'end': PP_ALIGN.RIGHT}
def rgb(c):
    v = [float(x) for x in re.findall(r'[\d.]+', c)]
    return RGBColor(*[int(x) for x in v[:3]])
for k in sorted(D):
    s = prs.slides.add_slide(blank)
    if not TEXT_ONLY: s.shapes.add_picture(f'bg/{k}.jpg', 0, 0, prs.slide_width, prs.slide_height)
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
                    f = rr.font; f.size = Pt(round(r['s'] * 0.75 * 2) / 2); f.bold = r['b']
                    if r['f'] != 'Noto Sans KR': f.name = r['f']
                    f.color.rgb = rgb(r['c'])
                    if r.get('ls'): rr._r.get_or_add_rPr().set('spc', str(int(r['ls'] * 75)))
OUT = sys.argv[1] if len(sys.argv) > 1 else 'slides_editable.pptx'
prs.save(OUT)
# 작게 다시 묶기: 테마 글꼴을 Noto Sans KR로, 쓸데없는 속성 지우기
import zipfile, io
zin = zipfile.ZipFile(OUT); buf = io.BytesIO(); zout = zipfile.ZipFile(buf, 'w', zipfile.ZIP_DEFLATED, compresslevel=9)
for it in zin.infolist():
    d = zin.read(it.filename)
    if it.filename == 'ppt/theme/theme1.xml':
        t = d.decode()
        t = re.sub(r'(<a:(?:major|minor)Font><a:latin typeface=")[^"]*("[^>]*/><a:ea typeface=")[^"]*', r'\1Noto Sans KR\2Noto Sans KR', t)
        d = t.encode()
    elif it.filename.startswith('ppt/slides/slide'):
        t = d.decode()
        t = re.sub(r' name="TextBox \d+"', ' name=""', t).replace(' algn="l"', '').replace('<a:prstGeom prst="rect"><a:avLst/></a:prstGeom>', '<a:prstGeom prst="rect"/>')
        d = t.encode()
    zout.writestr(it, d, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
zout.close(); open(OUT, 'wb').write(buf.getvalue())
