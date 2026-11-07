# 수업 자료의 업체 목록(companies.json)을 js/parts.js로 바꿉니다.
# 사용법: python3 tools/import_companies.py /mnt/project-files/lesson-materials/companies.json js/parts.js
import json, re, sys

src = sys.argv[1] if len(sys.argv) > 1 else 'companies.json'
dst = sys.argv[2] if len(sys.argv) > 2 else 'js/parts.js'
d = json.load(open(src, encoding='utf-8'))

# 로켓 그림에서 아래에서 위로 쌓는 순서와 모양 (부품 번호 → 모양)
STACK = [
    (1, 'nozzle'), (10, 'shield'), (2, 'pipes'), (3, 'body'), (9, 'body'), (8, 'insulation'),
    (12, 'body'), (6, 'band'), (11, 'body'), (4, 'panel'), (7, 'nose'), (5, 'fins'),
]
TYPE = {'real': '누리호 참여 확인', 'aero': '항공우주 기업(수업용 연결)', 'similar': '닮은 기술의 지역 기업'}

by_no = {p['no']: p for p in d['parts']}
missing = set(by_no) - {n for n, _ in STACK}
if missing:
    sys.exit(f'로켓 모양이 정해지지 않은 부품 번호: {sorted(missing)} (STACK을 고쳐 주세요)')

def short(part):
    return re.sub(r'\s*\(.*\)\s*$', '', part).strip()

def region(sigun):
    m = re.match(r'(\S+?[시군])', sigun)
    return m.group(1) if m else sigun

parts = []
for no, shape in STACK:
    p = by_no.get(no)
    if not p:
        continue
    parts.append({
        'no': no, 'name': short(p['part']), 'fullName': p['part'], 'shape': shape,
        'region': region(p['sigun']), 'place': p['sigun'], 'lat': p['lat'], 'lon': p['lon'],
        'kidRole': p.get('kid_role', ''), 'question': p.get('question', ''), 'hint': p.get('hint', ''),
        'company': p.get('company', ''), 'type': TYPE.get(p.get('type'), p.get('type', '')),
        'evidence': {'summary': p.get('evidence', ''), 'sources': p.get('sources', [])},
    })

pad = d.get('pad', {})
launch = {'name': '로켓 발사대', 'region': region(pad.get('sigun', '사천시')), 'lon': pad.get('lon'), 'lat': pad.get('lat'),
          'note': pad.get('name', ''), 'evidence': {'summary': pad.get('evidence', ''), 'sources': pad.get('sources', [])}}

with open(dst, 'w', encoding='utf-8') as f:
    f.write('// 자동 생성 파일: tools/import_companies.py로 만들었습니다. 업체 내용은 companies.json을 고친 뒤 다시 만드세요.\n')
    f.write('// 배열 순서 = 로켓 그림에서 아래에서 위로 쌓이는 순서, no = 수업 자료의 부품 번호\n')
    f.write('window.ROCKET_DATA.parts = ' + json.dumps(parts, ensure_ascii=False, indent=1) + ';\n')
    f.write('window.ROCKET_DATA.launchSite = ' + json.dumps(launch, ensure_ascii=False, indent=1) + ';\n')
print(f'{len(parts)}개 부품을 {dst}에 썼습니다.')
