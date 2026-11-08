# 경남 시군 경계를 화면용 js/geo.js로 바꾸는 스크립트 (pip install shapely 필요)
# 사용법: python3 tools/build_geo.py skorea_municipalities_geo.json js/geo.js
# 원본: https://raw.githubusercontent.com/southkorea/southkorea-maps/master/kostat/2013/json/skorea_municipalities_geo.json
import json, math, sys
from shapely.geometry import shape, Polygon, MultiPolygon
from shapely.ops import unary_union, transform
d=json.load(open(sys.argv[1] if len(sys.argv)>1 else 'skorea_municipalities_geo.json'))
g=[f for f in d['features'] if f['properties']['code'].startswith('38')]
lat0=35.2; lon0=127.5; k=math.cos(math.radians(lat0))
def proj(x,y,z=None): return ((x-lon0)*k*111.32, -(y-lat0)*110.57)
groups={}
for f in g:
    n=f['properties']['name']
    if n.startswith('창원시'): n='창원시'
    groups.setdefault(n,[]).append(transform(proj, shape(f['geometry']).buffer(0)))
regs=[]
allg=[]
for n,gs in groups.items():
    u=unary_union(gs).buffer(0.01).buffer(-0.01)
    polys=list(u.geoms) if isinstance(u,MultiPolygon) else [u]
    polys=[p for p in polys if p.area>0.6]
    u=MultiPolygon(polys) if len(polys)>1 else polys[0]
    regs.append((n,u)); allg.append(u)
tot=unary_union(allg)
minx,miny,maxx,maxy=tot.bounds
print('bounds km',maxx-minx,maxy-miny,file=sys.stderr)
def path(geom,tol):
    s=geom.simplify(tol,preserve_topology=True)
    polys=list(s.geoms) if isinstance(s,MultiPolygon) else [s]
    out=[]
    for p in polys:
        for ring in [p.exterior]+list(p.interiors):
            c=list(ring.coords)
            if len(c)<4: continue
            out.append('M'+' '.join(f'{x-minx:.1f},{y-miny:.1f}' for x,y in c[:-1])+'Z')
    return ''.join(out)
res=[]
npts=0
bus=[transform(proj, shape(f['geometry']).buffer(0)) for f in d['features'] if f['properties']['code'].startswith('21')]
bu=unary_union(bus).buffer(0.01).buffer(-0.01)
bp=[p for p in (bu.geoms if isinstance(bu,MultiPolygon) else [bu]) if p.area>0.6]
bu=MultiPolygon(bp) if len(bp)>1 else bp[0]
bc=max(bp,key=lambda p:p.area).representative_point()
neighbors=[{'name':'부산광역시','d':path(bu,0.12),'x':round(bc.x-minx,1),'y':round(bc.y-miny,1)}]
# 실제 발사장(나로우주센터)이 있는 전남 고흥군도 지도 밖 참고용으로 넣습니다.
for f in d['features']:
    if f['properties']['name']=='고흥군':
        gh=transform(proj, shape(f['geometry']).buffer(0)).buffer(0.01).buffer(-0.01)
        gp=[p for p in (gh.geoms if isinstance(gh,MultiPolygon) else [gh]) if p.area>0.6]
        gh=MultiPolygon(gp) if len(gp)>1 else gp[0]
        gc=max(gp,key=lambda p:p.area).representative_point()
        neighbors.append({'name':'전남 고흥군','d':path(gh,0.12),'x':round(gc.x-minx,1),'y':round(gc.y-miny,1)})
for n,u in regs:
    rp=u.representative_point()
    # 가장 큰 조각의 중심을 이름 위치로
    big=max(u.geoms,key=lambda p:p.area) if isinstance(u,MultiPolygon) else u
    c=big.representative_point()
    dd=path(u,0.12)
    npts+=dd.count(' ')
    short=n[:-1] if len(n)>2 else n
    res.append({'name':n,'short':short,'d':dd,'x':round(c.x-minx,1),'y':round(c.y-miny,1)})
print('pts',npts,file=sys.stderr)
out={'proj':{'lat0':lat0,'lon0':lon0,'k':k,'minx':minx,'miny':miny},'unit':'km','width':round(maxx-minx,1),'height':round(maxy-miny,1),'regions':res,'neighbors':neighbors,
 'source':'통계청 2013 시군구 경계 (southkorea/southkorea-maps, kostat), 창원시 5개 구는 하나로 합침'}
open(sys.argv[2] if len(sys.argv)>2 else 'js/geo.js','w').write('// 경상남도 18개 시군 경계 (단위: km, 왼쪽 위가 0,0)\n// 출처: '+out['source']+'\nwindow.GN_MAP = '+json.dumps(out,ensure_ascii=False)+';\n')
