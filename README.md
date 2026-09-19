# 하루 기록 캐릭터 다이어리

일기를 쓰면 본문의 감정을 판별해 그날의 캐릭터가 태어나고, 화면 안을 천천히 걸어 다닙니다.
React + Vite + TypeScript 단일 페이지 앱이며, 서버 없이 localStorage만 사용합니다.

## 실행

```bash
npm install
npm run dev      # 개발 서버
npm run build    # 타입체크 + 프로덕션 빌드 (dist/)
npm run preview  # 빌드 결과 미리보기
```

## 구조

```
src/
├── main.tsx                     진입점
├── App.tsx / App.css            씬 위에 HUD·독·시트를 얹는 화면 조립
├── types.ts                     DiaryEntry, Mood 데이터 모델
├── lib/
│   ├── mood.ts                  키워드 기반 감정 판별 + 감정별 색/라벨
│   └── storage.ts               localStorage 입출력, 날짜 유틸
├── hooks/
│   └── useDiary.ts              기록 목록 상태 + 저장 동기화 (하루 1건)
└── components/
    ├── Scene.tsx                풀스크린 배경 (하늘·해·구름·언덕·잔디)
    ├── Character.tsx            감정 prop → 색/눈/입이 바뀌는 SVG + 걷기 프레임
    ├── CharacterStage.tsx       잔디 위를 걸어 다니는 캐릭터 배치
    ├── DiaryDock.tsx            우측 하단 고정 입력 독 (접힘/펼침/기록 완료)
    ├── HistoryPanel.tsx         지난 기록 바텀 시트
    └── DiaryList.tsx            날짜순 카드 리스트
```

## 화면 구성

스크롤 없는 단일 씬입니다. 배경 위에 UI가 떠 있는 구조라 각 조각의 위치는 고정입니다.

- **배경 씬** — 하늘 그라데이션 위에 해·구름이 천천히 흐르고, 언덕 두 겹과 잔디가 깔립니다.
- **캐릭터** — 저장된 기록이 잔디 영역 위를 좌우로 거닙니다. 기록 id를 해시해 크기·속도·경로·
  걸음 주기를 정하므로, 새로고침해도 같은 캐릭터는 같은 성격으로 움직입니다. 안쪽(멀리) 캐릭터는
  작고 옅게 그려 원근감을 줍니다.
- **입력 독(우측 하단)** — 평소엔 버튼, 누르면 입력 카드가 펼쳐지고, 저장하면 다시 접힙니다.
  오늘 기록이 이미 있으면 "오늘의 기록 완료" 상태로 바뀝니다 (고쳐 쓰기 가능).
- **지난 기록(좌측 하단)** — 바텀 시트로 감정 집계와 카드 리스트를 띄웁니다.

## 데이터 모델

```ts
interface DiaryEntry {
  id: string        // 고유 id
  date: string      // YYYY-MM-DD (로컬 타임존 기준)
  text: string      // 일기 본문
  mood: Mood        // 'happy' | 'sad' | 'angry' | 'neutral'
  createdAt: number // 작성 시각
}
```

`localStorage`의 `character-diary:entries:v1` 키에 위 객체의 배열로 저장됩니다.
하루에 한 건만 두므로 같은 날짜로 다시 저장하면 기존 기록을 대체합니다.
읽을 때 형식이 맞지 않는 항목은 걸러내므로, 예전 데이터가 남아 있어도 앱이 깨지지 않습니다.

## 감정 판별

`detectMood(text)`가 감정별 키워드 사전(한국어 어간 · 영어 · 이모지)의 등장 횟수를 세어
가장 많은 감정을 반환합니다. 매칭이 없거나 최고 점수가 동점이면 `neutral`입니다.
키워드는 `src/lib/mood.ts`의 `KEYWORDS`에서 바로 늘릴 수 있습니다.
입력 중에도 같은 함수로 감정을 미리 보여줍니다.

## 배포 (Vercel)

레포 루트를 그대로 임포트하면 됩니다. `vercel.json`에 framework(vite), 빌드 명령,
출력 디렉터리(`dist`), SPA rewrite가 들어 있어 추가 설정이 필요 없습니다.
