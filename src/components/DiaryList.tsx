import type { DiaryEntry } from '../types'
import { MOOD_META } from '../lib/mood'
import { formatDate } from '../lib/storage'
import { Character } from './Character'
import './DiaryList.css'

interface DiaryListProps {
  /** 이미 최신순으로 정렬된 기록 */
  entries: DiaryEntry[]
  onRemove: (id: string) => void
}

export function DiaryList({ entries, onRemove }: DiaryListProps) {
  if (entries.length === 0) {
    return <p className="list__empty">아직 저장된 기록이 없습니다.</p>
  }

  return (
    <ul className="list">
      {entries.map((entry) => (
        <li className="card" key={entry.id} data-mood={entry.mood}>
          <div className="card__avatar">
            <Character mood={entry.mood} size={56} />
          </div>
          <div className="card__body">
            <div className="card__head">
              <time className="card__date" dateTime={entry.date}>
                {formatDate(entry.date)}
              </time>
              <span className="card__mood">
                {MOOD_META[entry.mood].emoji} {MOOD_META[entry.mood].label}
              </span>
            </div>
            <p className="card__text">{entry.text}</p>
          </div>
          <button
            className="card__remove"
            type="button"
            onClick={() => onRemove(entry.id)}
            aria-label={`${formatDate(entry.date)} 기록 삭제`}
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  )
}
