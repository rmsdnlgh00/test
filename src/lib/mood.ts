import type { Mood } from '../types'

/**
 * 감정별 키워드 사전. 한국어는 활용형이 많아 어간 위주로 넣고,
 * 영어/이모지도 함께 본다. 부분 문자열 포함으로 매칭한다.
 */
const KEYWORDS: Record<Exclude<Mood, 'neutral'>, string[]> = {
  happy: [
    '행복', '기쁘', '기뻐', '즐거', '즐겁', '신나', '좋았', '좋다', '좋아', '최고',
    '뿌듯', '설레', '웃', '재밌', '재미', '사랑', '고마', '감사', '성공', '칭찬',
    'happy', 'joy', 'great', 'good', 'love', 'fun', 'yay',
    '😊', '😄', '😆', '🥰', '❤️',
  ],
  sad: [
    '슬프', '슬퍼', '우울', '눈물', '울었', '울고', '외로', '쓸쓸', '허무', '공허',
    '지친', '지쳐', '힘들', '아프', '보고싶', '그립', '실패', '후회', '미안',
    'sad', 'lonely', 'cry', 'tired', 'depress', 'miss',
    '😢', '😭', '😔', '💔',
  ],
  angry: [
    '화나', '화남', '짜증', '빡쳐', '빡침', '분노', '열받', '싫어', '싫다', '미쳐',
    '억울', '불만', '스트레스', '답답', '최악', '진상',
    'angry', 'mad', 'annoy', 'hate', 'stress', 'worst',
    '😡', '😠', '🤬',
  ],
}

/**
 * 키워드 개수를 세어 가장 많이 등장한 감정을 반환한다.
 * 동점이거나 하나도 없으면 neutral.
 */
export function detectMood(text: string): Mood {
  const lower = text.toLowerCase()

  const scores = (Object.keys(KEYWORDS) as Array<Exclude<Mood, 'neutral'>>).map((mood) => ({
    mood,
    score: KEYWORDS[mood].reduce(
      (sum, keyword) => sum + countOccurrences(lower, keyword.toLowerCase()),
      0,
    ),
  }))

  const best = scores.reduce((a, b) => (b.score > a.score ? b : a))
  if (best.score === 0) return 'neutral'

  const tied = scores.filter((s) => s.score === best.score)
  return tied.length > 1 ? 'neutral' : best.mood
}

function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0
  let count = 0
  let index = haystack.indexOf(needle)
  while (index !== -1) {
    count += 1
    index = haystack.indexOf(needle, index + needle.length)
  }
  return count
}

/**
 * 감정별 표시용 라벨. 캐릭터 색은 의상이 결정하므로 여기에는 색이 없다 —
 * 감정이 캐릭터의 생김새나 가치에 영향을 주지 않게 하려는 의도다 (스펙 1장).
 */
export const MOOD_META: Record<Mood, { label: string; emoji: string }> = {
  happy: { label: '행복', emoji: '😊' },
  sad: { label: '슬픔', emoji: '😢' },
  angry: { label: '화남', emoji: '😠' },
  neutral: { label: '보통', emoji: '😐' },
}
