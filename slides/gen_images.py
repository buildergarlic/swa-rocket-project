"""MonoRouter(OpenAI 호환) 이미지 생성. 결과는 slides/ai/<name>.png
키: Network secrets(monogpt.kr, Authorization) 또는 환경 변수 MONOROUTER_API_KEY.
디자인 기준: 한국항공우주산업(KAI) 홈페이지 - 검은/짙은 남색 배경, 영화 같은 실사 항공우주 사진, 푸른 조명, 넓은 여백."""
import base64, json, os, sys, urllib.request
BASE = 'https://monogpt.kr/api/monorouter/v1'
MODEL = os.environ.get('MONOROUTER_IMAGE_MODEL', 'gpt-image-2')
STYLE = ('Cinematic photorealistic aerospace corporate imagery like Korea Aerospace Industries website hero: '
         'deep black and navy tones, cool blue rim light, clean minimal composition, wide negative space on the left for text, '
         'high detail, no text, no letters, no logos, no flags.')
P = {
 'cover': 'A tall white two-stage rocket standing on a seaside launch pad at blue hour, steel launch tower beside it, calm sea and faint stars.',
 'sec1': 'Close-up of a rocket engine nozzle cluster in a clean assembly hall, blue light, engineers silhouettes far away.',
 'sec2': 'A bright classroom table seen from above with a large hand-drawn paper map, colored markers, two laptops and two small white wheeled toy robots, children hands only.',
 'sec3': 'A large colorful hand-drawn paper map of a coastal province spread on a dark floor, with mountains, rivers, roads made of black tape, and small paper landmarks, seen from above.',
 'sec4': 'Precision aerospace factory in Changwon and Sacheon style: machined metal rocket parts on inspection tables, blue work lights, modern clean factory.',
 'sec5': 'A small white two-wheeled educational robot following a black tape line on a big hand-drawn map, macro photography, shallow depth of field, blue tint.',
 'sec6': 'A rocket lifting off with bright exhaust and huge white clouds over the sea at night, viewed from a distance.',
 'sec7': 'A tidy teacher desk with printed maps, part cards, a tablet and a small robot, overhead view, navy and white palette.',
 'mission': 'A tiny white delivery robot carrying a small rocket part box along a road on a colorful illustrated map of a coastal province, playful but realistic.',
}
def gen(name, prompt):
    out = f'ai/{name}.png'
    if os.path.exists(out): return
    body = json.dumps({'model': MODEL, 'prompt': prompt + ' ' + STYLE, 'size': '1536x1024', 'n': 1}).encode()
    h = {'Content-Type': 'application/json', 'User-Agent': 'curl/8.5.0'}
    if os.environ.get('MONOROUTER_API_KEY'): h['Authorization'] = 'Bearer ' + os.environ['MONOROUTER_API_KEY']
    r = json.load(urllib.request.urlopen(urllib.request.Request(BASE + '/images/generations', body, h), timeout=300))
    d = r['data'][0]
    data = base64.b64decode(d['b64_json']) if d.get('b64_json') else urllib.request.urlopen(d['url'], timeout=120).read()
    open(out, 'wb').write(data); print('ok', name)
if __name__ == '__main__':
    for k in (sys.argv[1:] or P): gen(k, P[k])
