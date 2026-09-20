# 하루 기록 캐릭터 다이어리

일기를 쓰면 본문의 감정을 판별해 그날의 캐릭터가 태어나고, 계절이 바뀌는 디오라마 배경 위를
걸어 다닙니다. React + Vite + TypeScript 단일 페이지 앱이며, 서버 없이 localStorage만 씁니다.

구현 기준은 `diary-app-spec.md` 입니다.

## 실행

```bash
npm install
npm run dev      # 개발 서버
npm run build    # 타입체크 + 프로덕션 빌드 (dist/)
npm run preview  # 빌드 결과 미리보기
```

`http://localhost:5173/?debug=1` 로 열면 지면 사각형·격자·걷는 영역·핫스팟이 화면에 그려집니다.
배경을 좌표계에서 직접 그리므로 보정할 일은 없지만, 지형을 고칠 때 확인용으로 씁니다.

## 설계의 중심 — 하나의 지면 좌표계

배경은 아이소메트릭 디오라마라서, 캐릭터 이동·소품 배치·안내 격자가 모두 같은 원근을
따라야 합니다. 그래서 `src/data/scene.ts` 의 `GROUND_QUAD` 네 점 **하나만** 정의하고
나머지를 전부 거기서 파생시킵니다.

- `uvToPoint` 가 지면 정규화 좌표 `(u, v)` 를 화면 % 좌표로 겹선형 보간합니다.
- `pointToUv` 는 그 역변환이라, 드래그로 찍은 화면 좌표가 지면의 어디인지 알아냅니다.
- 격자를 그릴지 말지와 소품을 놓을 수 있는지를 **같은 `isPlaceable`** 로 판정하므로,
  눈에 보이는 격자와 실제 판정 영역이 어긋날 수 없습니다.

배경 이미지가 화면을 `cover` 로 덮으면 화면 비율에 따라 잘리는데, 좌표가 화면 기준이면
잔디 위치와 어긋납니다. 그래서 이미지와 같은 비율의 프레임(`.stage__frame`)을 먼저
cover 크기로 깔고 모든 % 좌표를 그 프레임 기준으로 잡습니다.

## 배경은 SVG로 직접 그린다

배경은 이미지 파일이 아니라 `src/components/SceneArt.tsx` 가 그리는 벡터 디오라마입니다.
이미지를 쓰지 않는 이유가 셋 있습니다.

- 잔디·연못·화단·울타리를 좌표계(`GROUND_QUAD`, `POND`, `FLOWER_BED`)에서 바로 그리므로
  **그림과 판정 영역이 구조적으로 어긋날 수 없습니다.** 좌표를 눈대중으로 맞출 일이 없습니다.
- 계절 전환이 색 보정 필터가 아니라 **실제 잎 색과 물든 비율**로 표현됩니다.
  `src/data/season.ts` 에서 9월은 `accentRatio: 0.22`(초록 우세, 잎끝만 물듦),
  10월은 `0.8`(완연한 가을)로 스펙 3장의 무드 차이를 직접 다룹니다.
- 어떤 화면 크기에서도 또렷하고, 배경 전체가 수십 KB입니다.

고칠 때는:

- **지형을 바꾸려면** `src/data/scene.ts` 의 `GROUND_QUAD`·`WALK_BOUNDS`·`POND`·
  `FLOWER_BED`·`HOTSPOTS` 를 고칩니다. 배경 그림이 따라옵니다.
- **색을 바꾸려면** `src/data/season.ts` 의 월별 팔레트를 고칩니다.
- **그림 요소를 더하려면** `SceneArt.tsx` 에서 `at({ u, v })` 로 좌표를 잡습니다.
  그러면 원근이 자동으로 맞습니다.

그레인·라이팅 질감은 그림에 굽지 않고 `SceneBackground.css` 에서 CSS로 얹으므로,
계절 팔레트가 어떻게 바뀌어도 질감은 동일하게 유지됩니다.

## 구조

```
src/
├── main.tsx                      진입점
├── App.tsx / App.css             홈 화면 조립, 월 아카이브 네비게이션, 화면 전환
├── types.ts                      전역 타입
├── data/
│   ├── scene.ts                  지면 좌표계·걷는 영역·연못·화단·핫스팟  ← 좌표의 유일한 원천
│   ├── season.ts                 월별 계절 팔레트 (잎 색과 물든 비율)
│   └── catalog.ts                상점 카탈로그 (의상·소품), 재화 이름
├── lib/
│   ├── geometry.ts               겹선형 보간과 역변환, 영역 판정·밀어내기
│   ├── mood.ts                   키워드 기반 감정 판별
│   ├── currency.ts               일일 재화 수급 확률 계산
│   ├── date.ts                   날짜·월 포맷과 이동
│   └── storage.ts                localStorage 래퍼 (Supabase 이전 시 이 파일만 교체)
├── hooks/
│   ├── useGameStore.ts           기록·재화·인벤토리 상태와 저장
│   ├── useWanderers.ts           캐릭터 자율 이동과 핫스팟 점유
│   └── useDecorDrag.ts           꾸미기 모드 드래그 배치와 위치 보정
├── components/
│   ├── Stage.tsx / .css          배경·소품·캐릭터를 깊이순으로 세우는 무대
│   ├── SceneArt.tsx              배경 디오라마 SVG — 좌표계에서 직접 작도
│   ├── SceneBackground.tsx/.css  배경 조립 + CSS 그레인·라이팅 질감
│   ├── PerspectiveGrid.tsx       원근 격자 (배치 판정과 같은 데이터로 계산)
│   ├── Character.tsx / .css      캐릭터 SVG — 감정은 표정에만, 색은 의상이 결정
│   ├── DecorSprite.tsx           소품 아트
│   ├── DebugOverlay.tsx / .css   ?debug=1 좌표 보정 도구
│   └── Sheet.tsx / .css          공용 바텀시트
└── screens/
    ├── DiaryComposer.tsx         오늘의 일기 작성
    ├── Shop.tsx                  상점 (의상·소품, 시즌 필터)
    ├── DressingRoom.tsx          아무 날짜 캐릭터에게나 옷 입히기
    ├── DecorDrawer.tsx           꾸미기 모드 하단 서랍
    └── screens.css               화면 공용 스타일
```

## 설계 원칙

감정은 **표정에만** 영향을 줍니다. 재화 확률(`DAILY_DROP_RATE`)도, 상점 노출 조건도
감정과 무관합니다. 슬픈 일기를 쓰면 보상이 좋아지는 식의 설계는, 감정을 과장해서 쓰게
만드는 유인이 되므로 의도적으로 배제했습니다.

재화는 앱 로드 시 오늘이 `lastCollectedDate` 와 다를 때 **딱 1회만** 굴립니다.
며칠 만에 들어와도 하루치만 지급되고 밀린 날짜는 소급되지 않습니다.
