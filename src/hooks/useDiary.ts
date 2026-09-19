import { useCallback, useEffect, useMemo, useState } from 'react'
import type { DiaryEntry } from '../types'
import { createId, loadEntries, saveEntries } from '../lib/storage'
import { detectMood } from '../lib/mood'

/**
 * 기록 목록 상태 + localStorage 동기화.
 * 하루에 한 건만 두므로, 같은 날짜로 저장하면 기존 기록을 대체한다.
 */
export function useDiary() {
  const [entries, setEntries] = useState<DiaryEntry[]>(() => loadEntries())

  useEffect(() => {
    saveEntries(entries)
  }, [entries])

  const addEntry = useCallback((date: string, text: string) => {
    const entry: DiaryEntry = {
      id: createId(),
      date,
      text: text.trim(),
      mood: detectMood(text),
      createdAt: Date.now(),
    }
    setEntries((prev) => [entry, ...prev.filter((item) => item.date !== date)])
    return entry
  }, [])

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id))
  }, [])

  /** 날짜 내림차순 (최신이 앞) */
  const sorted = useMemo(
    () => [...entries].sort((a, b) => b.date.localeCompare(a.date)),
    [entries],
  )

  const entryOf = useCallback(
    (date: string) => sorted.find((entry) => entry.date === date) ?? null,
    [sorted],
  )

  return { entries: sorted, addEntry, removeEntry, entryOf }
}
