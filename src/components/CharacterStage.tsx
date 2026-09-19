import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import type { DiaryEntry } from '../types'
import { Character } from './Character'
import { MOOD_META } from '../lib/mood'
import { formatDate } from '../lib/storage'
import './CharacterStage.css'

interface CharacterStageProps {
  entries: DiaryEntry[]
  /** 화면에 동시에 띄울 최대 캐릭터 수 (최근 기록 우선) */
  limit?: number
}

/** 같은 id면 항상 같은 값이 나오도록 하는 간단한 해시. */
function hash(text: string): number {
  let h = 0
  for (let i = 0; i < text.length; i += 1) {
    h = (h * 31 + text.charCodeAt(i)) >>> 0
  }
  return h
}

export function CharacterStage({ entries, limit = 10 }: CharacterStageProps) {
  const walkers = useMemo(
    () =>
      entries.slice(0, limit).map((entry, index) => {
        const seed = hash(entry.id)
        return {
          entry,
          style: {
            // 캐릭터마다 크기/속도/시작 위치/높이를 다르게 해서 겹쳐 보이지 않게 한다.
            '--size': `${56 + (seed % 3) * 10}px`,
            '--duration': `${14 + (seed % 9)}s`,
            '--delay': `-${seed % 14}s`,
            '--lane': `${8 + ((index * 23 + (seed % 17)) % 58)}%`,
            '--bob': `${1.6 + ((seed >> 3) % 8) / 10}s`,
            zIndex: index,
          } as CSSProperties,
        }
      }),
    [entries, limit],
  )

  return (
    <section className="stage" aria-label="캐릭터 무대">
      {walkers.length === 0 ? (
        <p className="stage__empty">
          아직 캐릭터가 없어요.
          <br />
          오늘의 일기를 쓰면 감정에 맞는 캐릭터가 태어납니다.
        </p>
      ) : (
        walkers.map(({ entry, style }) => (
          <div className="walker" key={entry.id} style={style}>
            <div className="walker__flip">
              <div className="walker__bob">
                <Character mood={entry.mood} className="walker__svg" />
              </div>
            </div>
            <span className="walker__tip">
              {formatDate(entry.date)} · {MOOD_META[entry.mood].label}
            </span>
          </div>
        ))
      )}
    </section>
  )
}
