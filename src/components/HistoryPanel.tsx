import { useEffect, useMemo } from 'react'
import type { DiaryEntry, Mood } from '../types'
import { MOOD_META } from '../lib/mood'
import { DiaryList } from './DiaryList'
import './HistoryPanel.css'

interface HistoryPanelProps {
  open: boolean
  entries: DiaryEntry[]
  onClose: () => void
  onRemove: (id: string) => void
}

/** 지난 기록을 덮어 띄우는 바텀 시트. 배경 씬을 가리지 않도록 화면 아래에서 올라온다. */
export function HistoryPanel({ open, entries, onClose, onRemove }: HistoryPanelProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const counts = useMemo(() => {
    const base: Record<Mood, number> = { happy: 0, sad: 0, angry: 0, neutral: 0 }
    for (const entry of entries) base[entry.mood] += 1
    return base
  }, [entries])

  if (!open) return null

  return (
    <div className="sheet-layer">
      <button className="sheet__backdrop" type="button" aria-label="닫기" onClick={onClose} />
      <section className="sheet" role="dialog" aria-modal="true" aria-label="지난 기록">
        <header className="sheet__head">
          <h2 className="sheet__title display">지난 기록</h2>
          <button className="sheet__close" type="button" onClick={onClose} aria-label="닫기">
            ×
          </button>
        </header>

        <ul className="sheet__stats">
          {(Object.keys(MOOD_META) as Mood[]).map((mood) => (
            <li className="sheet__stat" key={mood}>
              <span className="sheet__stat-emoji">{MOOD_META[mood].emoji}</span>
              <span className="sheet__stat-count display">{counts[mood]}</span>
              <span className="sheet__stat-label">{MOOD_META[mood].label}</span>
            </li>
          ))}
        </ul>

        <div className="sheet__body">
          <DiaryList entries={entries} onRemove={onRemove} />
        </div>
      </section>
    </div>
  )
}
