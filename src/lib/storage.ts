/**
 * localStorage 얇은 래퍼. 사파리 프라이빗 모드처럼 접근 자체가 던지는 환경이 있어
 * 읽기/쓰기를 모두 try로 감싸고, 실패하면 기본값으로 조용히 넘어간다.
 * (추후 Supabase로 옮길 때 이 파일만 갈아끼우면 되도록 한 곳에 모아 둔다.)
 */

const PREFIX = 'character-diary:v2:'

export function readJson<T>(key: string, fallback: T, revive?: (raw: unknown) => T | null): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw === null) return fallback
    const parsed: unknown = JSON.parse(raw)
    if (revive) {
      const revived = revive(parsed)
      return revived === null ? fallback : revived
    }
    return parsed as T
  } catch {
    return fallback
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // 저장 실패해도 화면 동작은 유지한다.
  }
}

export const STORAGE_KEYS = {
  entries: 'entries',
  wallet: 'wallet',
  inventory: 'inventory',
} as const
