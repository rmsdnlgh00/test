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
├── App.tsx / App.css            화면 조립 (무대 · 탭 · 폼/리스트)
├── types.ts                     DiaryEntry, Mood 데이터 모델
├── lib/
│   ├── mood.ts                  키워드 기반 감정 판별 + 감정별 색/라벨
│   └── storage.ts               localStorage 입출력, 날짜 유틸
├── hooks/
│   └── useDiary.ts              기록 목록 상태 + 저장 동기화
└── components/
    ├── Character.tsx            감정 prop → 색/눈/입이 바뀌는 SVG 캐릭터
    ├── CharacterStage.tsx       캐릭터가 좌우로 걸어 다니는 무대 (CSS 애니메이션)
    ├── DiaryForm.tsx            날짜 + 본문 입력 폼 (감정 실시간 미리보기)
    └── DiaryList.tsx            날짜순 카드 리스트
```

## 데이터 모델

```ts
interface DiaryEntry {
  id: string        // 고유 id
  date: string      // YYYY-MM-DD (로컬 타임존 기준)
  text: string      // 일기 본문
  mood: Mood        // 'happy' | 'sad' | 'angry' | 'neutral'
  createdAt: number // 작성 시각 (같은 날짜 안 정렬용)
}
```

`localStorage`의 `character-diary:entries:v1` 키에 위 객체의 배열로 저장됩니다.
읽을 때 형식이 맞지 않는 항목은 걸러내므로, 예전 데이터가 남아 있어도 앱이 깨지지 않습니다.

## 감정 판별

`detectMood(text)`가 감정별 키워드 사전(한국어 어간 · 영어 · 이모지)의 등장 횟수를 세어
가장 많은 감정을 반환합니다. 매칭이 없거나 최고 점수가 동점이면 `neutral`입니다.
키워드는 `src/lib/mood.ts`의 `KEYWORDS`에서 바로 늘릴 수 있습니다.

## 배포 (Vercel)

레포 루트를 그대로 임포트하면 됩니다. `vercel.json`에 framework(vite), 빌드 명령,
출력 디렉터리(`dist`), SPA rewrite가 들어 있어 추가 설정이 필요 없습니다.
