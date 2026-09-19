import { useCallback, useEffect, useMemo, useState } from 'react'
import type { DiaryEntry } from '../types'
import { createId, loadEntries, saveEntries } from '../lib/storage'
import { detectMood } from '../lib/mood'

/**
 * 기록 목록 상태 + localStorage 동기화를 담당한다.
 * 목록은 항상 최신순(날짜 내림차순)으로 정렬해서 내보낸다.
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
    setEntries((prev) => [entry, ...prev])
    return entry
  }, [])

  const removeEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id))
  }, [])

  const sorted = useMemo(
    () =>
      [...entries].sort((a, b) =>
        a.date === b.date ? b.createdAt - a.createdAt : b.date.localeCompare(a.date),
      ),
    [entries],
  )

  return { entries: sorted, addEntry, removeEntry }
}
