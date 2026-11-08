# 햄스터봇 택배 코딩: 엔트리 코드 그림과 슬라이드

경남 로켓 발사 작전 수업에서 햄스터봇(그리퍼)이 검은 도로를 따라 로켓 부품을 발사대까지 배달하는 엔트리 코드를 설명하는 자료를 만드는 도구입니다.

- 그림 11장(가로 1600px, 인쇄·배포용): `page.html` + `pages.js` → `shoot.js`
- 16:9 슬라이드 15장(Google 슬라이드용): `slide.html` + `slides.js` → `sextract.js` → `build_gslides.py`

엔트리 블록 모양은 `blocks.js`가 SVG로 직접 그립니다(엔트리 라이브러리를 실행하지 않음). 블록 이름은 entryjs 4.0.23의 햄스터 블록 한국어 이름과 같습니다. `icons/`의 블록 아이콘은 entryjs(Apache-2.0)에서 가져왔습니다.

## 준비

글꼴 파일은 저장소에 넣지 않았습니다. `fonts/` 아래에 받아 두어야 합니다.

```
npm pack @fontsource/jua @fontsource/nanum-gothic @fontsource/noto-sans-kr
# 각 패키지를 풀어서 fonts/jua, fonts/nanum, fonts/noto 폴더에 css와 files/ 를 넣음
# Pretendard: fonts/pretendard/Pretendard-{Regular,SemiBold,Bold,ExtraBold}.woff2
```

## 그림 11장

```
node shoot.js 1.5 out 01 02 03 04 05 06 07 08 09 10 11
node mkpdf.js out/all.pdf   # (final/ 폴더 기준이면 경로를 맞춤)
```

## Google 슬라이드

슬라이드의 글자는 편집할 수 있는 글자 상자이고, 블록과 그림은 배경 그림입니다.

1. `node slideshot.js 1 sout` 로 15장을 보고 넘침을 확인합니다.
2. `node sextract.js` → `stext.json`(글자 상자)과 `sbg/*.jpg`(글자를 지운 배경)를 만듭니다.
3. 배경 그림을 이 폴더의 `slides-bg/`에 넣고 커밋해서 올립니다.
4. `python3 build_gslides.py https://raw.githubusercontent.com/<owner>/<repo>/<commit>/hamster-code/slides-bg` → `gs/b*.json`
5. 각 묶음을 Slides API `presentations.batchUpdate`로 보냅니다.

## 코드 규칙(수업 자료와 맞춰야 함)

- [검은색 선을 따라 ○○ 교차로까지 이동하기] 블록 1개 = 교차로 1개. 발사대 앞 + 표시가 마지막 교차로.
- 변수 `교차로 수`가 5보다 크면 양쪽 LED 노란색(장거리), 아니면 끔.
- 잡기: 집게 열기 → 앞으로 0.3초 → 집게 닫기. 내려놓기: 정지 → 집게 열기 → 뒤로 0.5초 → 집게 끄기 → LED 끄기 → 삐.
- 로봇 1대가 부품 3개: 키 1·2·3, 신호 `부품 잡기`, `부품 내려놓기`.
