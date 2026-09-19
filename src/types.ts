/** 감정 4종. 캐릭터의 색/표정과 1:1로 대응된다. */
export type Mood = 'happy' | 'sad' | 'angry' | 'neutral'

/** localStorage에 배열로 저장되는 하루치 기록 한 건. */
export interface DiaryEntry {
  /** 고유 id (정렬/삭제 키) */
  id: string
  /** YYYY-MM-DD */
  date: string
  /** 일기 본문 */
  text: string
  /** 본문에서 판별된 감정 */
  mood: Mood
  /** 작성 시각 (같은 날짜 안에서의 정렬용) */
  createdAt: number
}
