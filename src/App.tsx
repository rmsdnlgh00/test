import { useState } from 'react'
import { useDiary } from './hooks/useDiary'
import { Scene } from './components/Scene'
import { CharacterStage } from './components/CharacterStage'
import { DiaryDock } from './components/DiaryDock'
import { HistoryPanel } from './components/HistoryPanel'
import { MOOD_META } from './lib/mood'
import { formatDate, todayISO } from './lib/storage'
import type { Mood } from './types'
import './App.css'

export function App() {
  const { entries, addEntry, removeEntry, entryOf } = useDiary()
  const [historyOpen, setHistoryOpen] = useState(false)
  const [justSaved, setJustSaved] = useState<Mood | null>(null)

  const today = todayISO()
  const todayEntry = entryOf(today)

  const handleSubmit = (text: string) => {
    const entry = addEntry(today, text)
    setJustSaved(entry.mood)
    window.setTimeout(() => setJustSaved(null), 2800)
  }

  return (
    <div className="app">
      <Scene />
      <CharacterStage entries={entries} />

      <header className="hud hud--top">
        <h1 className="hud__title display">하루 기록 캐릭터 다이어리</h1>
        <p className="hud__subtitle">
          {entries.length === 0
            ? '일기를 쓰면 그날의 감정이 캐릭터가 되어 마을에 살아요'
            : `${entries.length}명의 캐릭터가 마을을 걷고 있어요`}
        </p>
      </header>

      {justSaved && (
        <p className="toast" role="status">
          {MOOD_META[justSaved].emoji} <strong>{MOOD_META[justSaved].label}</strong> 캐릭터가
          태어났어요!
        </p>
      )}

      <button
        className="hud hud--history display"
        type="button"
        onClick={() => setHistoryOpen(true)}
      >
        지난 기록 {entries.length > 0 && <span className="hud__badge">{entries.length}</span>}
      </button>

      <DiaryDock today={formatDate(today)} todayEntry={todayEntry} onSubmit={handleSubmit} />

      <HistoryPanel
        open={historyOpen}
        entries={entries}
        onClose={() => setHistoryOpen(false)}
        onRemove={removeEntry}
      />
    </div>
  )
}
