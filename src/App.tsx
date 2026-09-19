import { useMemo, useState } from 'react'
import { useDiary } from './hooks/useDiary'
import { DiaryForm } from './components/DiaryForm'
import { DiaryList } from './components/DiaryList'
import { CharacterStage } from './components/CharacterStage'
import { MOOD_META } from './lib/mood'
import type { Mood } from './types'
import './App.css'

type Tab = 'write' | 'history'

export function App() {
  const { entries, addEntry, removeEntry } = useDiary()
  const [tab, setTab] = useState<Tab>('write')
  const [justSaved, setJustSaved] = useState<Mood | null>(null)

  const counts = useMemo(() => {
    const base: Record<Mood, number> = { happy: 0, sad: 0, angry: 0, neutral: 0 }
    for (const entry of entries) base[entry.mood] += 1
    return base
  }, [entries])

  const handleSubmit = (date: string, text: string) => {
    const entry = addEntry(date, text)
    setJustSaved(entry.mood)
    window.setTimeout(() => setJustSaved(null), 2600)
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">하루 기록 캐릭터 다이어리</h1>
        <p className="app__subtitle">일기를 쓰면 그날의 감정이 캐릭터가 되어 돌아다녀요.</p>
      </header>

      <CharacterStage entries={entries} />

      {justSaved && (
        <p className="app__toast" role="status">
          {MOOD_META[justSaved].emoji} <strong>{MOOD_META[justSaved].label}</strong> 캐릭터가
          태어났어요!
        </p>
      )}

      <nav className="app__tabs" role="tablist" aria-label="화면 전환">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'write'}
          className="app__tab"
          onClick={() => setTab('write')}
        >
          오늘 쓰기
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'history'}
          className="app__tab"
          onClick={() => setTab('history')}
        >
          지난 기록 ({entries.length})
        </button>
      </nav>

      <main className="app__main">
        {tab === 'write' ? (
          <DiaryForm onSubmit={handleSubmit} />
        ) : (
          <>
            <ul className="app__stats">
              {(Object.keys(MOOD_META) as Mood[]).map((mood) => (
                <li key={mood} className="app__stat" data-mood={mood}>
                  <span className="app__stat-emoji">{MOOD_META[mood].emoji}</span>
                  <span className="app__stat-count">{counts[mood]}</span>
                  <span className="app__stat-label">{MOOD_META[mood].label}</span>
                </li>
              ))}
            </ul>
            <DiaryList entries={entries} onRemove={removeEntry} />
          </>
        )}
      </main>

      <footer className="app__footer">기록은 이 브라우저(localStorage)에만 저장됩니다.</footer>
    </div>
  )
}
