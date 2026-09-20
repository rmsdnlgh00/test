/** 오늘 날짜를 로컬 타임존 기준 YYYY-MM-DD로. (toISOString은 UTC라 하루 밀릴 수 있음) */
export function todayISO(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** '2026-09-14' → '2026-09' */
export const monthOf = (iso: string): string => iso.slice(0, 7)

/** 현재 달을 YYYY-MM으로. */
export const currentMonth = (date = new Date()): string => monthOf(todayISO(date))

/** 'YYYY-MM'을 offset개월만큼 옮긴다. */
export function shiftMonth(month: string, offset: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + offset, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** '2026-09' → '2026년 9월' */
export function formatMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  return Number.isFinite(y) && Number.isFinite(m) ? `${y}년 ${m}월` : month
}

/** '2026-09-14' → '9월 14일 (월)' */
export function formatDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][new Date(y, m - 1, d).getDay()]
  return `${m}월 ${d}일 (${weekday})`
}

/** '2026-09-14' → '2026년 9월 14일 (월)' */
export function formatFullDate(iso: string): string {
  const [y] = iso.split('-')
  return `${y}년 ${formatDay(iso)}`
}

export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
