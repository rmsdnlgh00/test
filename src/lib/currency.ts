/**
 * 재화 수급 (스펙 6장).
 *
 * 규칙:
 *  - 지금까지 만든 모든 캐릭터가 대상 (과거 달 포함, 누적)
 *  - 앱 로드 시 오늘이 lastCollectedDate와 다르면 딱 1회만 굴린다
 *  - 며칠 만에 들어와도 하루치만 지급 (소급 없음)
 *  - 확률은 감정과 무관한 고정값. 감정이 보상에 영향을 주면 안 된다 (스펙 1장 원칙)
 */

/** 캐릭터 한 마리가 하루에 재화를 줄 확률. 밸런스 조정 지점. */
export const DAILY_DROP_RATE = 0.3

export interface CollectResult {
  gained: number
  newLastCollectedDate: string
}

export function collectDailyCurrency(
  characterCount: number,
  lastCollectedDate: string | null,
  today: string,
  rate = DAILY_DROP_RATE,
): CollectResult | null {
  if (lastCollectedDate === today) return null
  let gained = 0
  for (let i = 0; i < characterCount; i += 1) {
    if (Math.random() < rate) gained += 1
  }
  return { gained, newLastCollectedDate: today }
}
