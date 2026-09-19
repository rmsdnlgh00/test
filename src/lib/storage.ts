import type { DiaryEntry, Mood } from '../types'

const STORAGE_KEY = 'character-diary:entries:v1'
const MOODS: Mood[] = ['happy', 'sad', 'angry', 'neutral']

/** localStorage에서 기록 배열을 읽는다. 깨진 데이터는 조용히 버린다. */
export function loadEntries(): DiaryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isDiaryEntry)
  } catch {
    return []
  }
}

/** 기록 배열을 통째로 저장한다. (사파리 프라이빗 모드 등에서 실패할 수 있어 try로 감쌈) */
export function saveEntries(entries: DiaryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // 저장 실패해도 화면 동작은 유지한다.
  }
}

function isDiaryEntry(value: unknown): value is DiaryEntry {
  if (typeof value !== 'object' || value === null) return false
  const entry = value as Record<string, unknown>
  return (
    typeof entry.id === 'string' &&
    typeof entry.date === 'string' &&
    typeof entry.text === 'string' &&
    typeof entry.createdAt === 'number' &&
    MOODS.includes(entry.mood as Mood)
  )
}

/** 오늘 날짜를 로컬 타임존 기준 YYYY-MM-DD로. (toISOString은 UTC라 하루 밀릴 수 있음) */
export function todayISO(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 2026-09-19 → 2026년 9월 19일 (금) */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  const date = new Date(y, m - 1, d)
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()]
  return `${y}년 ${m}월 ${d}일 (${weekday})`
}

export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
