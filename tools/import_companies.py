# 수업 자료의 업체 목록(companies.json)을 js/parts.js로 바꿉니다.
# 사용법: python3 tools/import_companies.py /mnt/project-files/lesson-materials/companies.json js/parts.js
import json, re, sys

src = sys.argv[1] if len(sys.argv) > 1 else 'companies.json'
dst = sys.argv[2] if len(sys.argv) > 2 else 'js/parts.js'
d = json.load(open(src, encoding='utf-8'))

# zone이 없을 때 부품 이름으로 로켓 구역을 짐작합니다.
ZONE_WORDS = [
    ('fairing', ['페어링', '노즈콘', '머리']), ('payload', ['위성', '탑재체']), ('fins', ['날개', '핀', '안정판']),
    ('avionics', ['전자', '컴퓨터', '유도', '항전', '통신', '안테나', '센서', '패널']),
    ('interstage', ['단 연결', '단 분리', '이음', '분리']), ('nozzle', ['노즐', '1단 엔진', '엔진 (']),
    ('engine2', ['2단 엔진', '3단 엔진']), ('engine', ['배관', '펌프', '밸브', '열 차단', '엔진']),
    ('tank2', ['2단', '3단']), ('tank1', ['탱크', '동체', '단열', '산화제', '연료']),
]
ZONES = {'nozzle', 'engine', 'fins', 'tank1', 'interstage', 'engine2', 'tank2', 'avionics', 'payload', 'fairing'}
def guess_zone(p):
    if p.get('zone') in ZONES:
        return p['zone']
    name = p.get('part', '')
    for z, words in ZONE_WORDS:
        if any(w in name for w in words):
            return z
    return 'tank1'

TYPE = {'real': '누리호 참여 확인', 'aero': '항공우주 기업(수업용 연결)', 'similar': '닮은 기술의 지역 기업',
        'inst': '공공 시험기관', 'fictional': '수업용 가상 업체(실제 지역 기반)'}

by_no = {p['no']: p for p in d['parts']}
def short(part):
    return re.sub(r'\s*\(.*\)\s*$', '', part).strip()

def region(sigun):
    m = re.search(r'(\S+[시군])(?=\s|$|\()', sigun)
    return m.group(1) if m else sigun

parts = []
for no in sorted(by_no):
    p = by_no[no]
    parts.append({
        'no': no, 'name': short(p['part']), 'fullName': p['part'], 'zone': guess_zone(p), 'group': p.get('group', p.get('sheet')),
        'region': region(p['sigun']), 'place': p['sigun'], 'lat': p['lat'], 'lon': p['lon'],
        'kidRole': p.get('kid_role', ''), 'question': p.get('question', ''), 'hint': p.get('hint', ''),
        'company': p.get('company', ''), 'type': TYPE.get(p.get('type'), p.get('type', '')),
        'evidence': {'summary': p.get('evidence', ''), 'sources': p.get('sources', [])},
    })

pad = d.get('pad', {})
launch = {'name': pad.get('short', '로켓 발사대'), 'region': region(pad.get('sigun', '')), 'place': pad.get('name', ''), 'lon': pad.get('lon'), 'lat': pad.get('lat'),
          'mapLat': (pad.get('map_anchor') or {}).get('lat'), 'mapLon': (pad.get('map_anchor') or {}).get('lon'),
          'note': pad.get('name', ''), 'evidence': {'summary': pad.get('evidence', ''), 'sources': pad.get('sources', [])}}

with open(dst, 'w', encoding='utf-8') as f:
    f.write('// 자동 생성 파일: tools/import_companies.py로 만들었습니다. 업체 내용은 companies.json을 고친 뒤 다시 만드세요.\n')
    f.write('// zone = 전자칠판 로켓 그림에서 붙는 자리, no = 수업 자료의 부품 번호\n')
    f.write('window.ROCKET_DATA.parts = ' + json.dumps(parts, ensure_ascii=False, indent=1) + ';\n')
    f.write('window.ROCKET_DATA.launchSite = ' + json.dumps(launch, ensure_ascii=False, indent=1) + ';\n')
print(f'{len(parts)}개 부품을 {dst}에 썼습니다.')
