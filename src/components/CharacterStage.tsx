import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import type { DiaryEntry } from '../types'
import { Character } from './Character'
import { MOOD_META } from '../lib/mood'
import { formatDate } from '../lib/storage'
import './CharacterStage.css'

interface CharacterStageProps {
  entries: DiaryEntry[]
  /** 잔디 위에 동시에 띄울 최대 캐릭터 수 (최근 기록 우선) */
  limit?: number
}

/** 같은 id면 늘 같은 값이 나오는 간단한 해시 — 새로고침해도 배치가 유지된다. */
function hash(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** seed에서 [min, max) 범위의 값을 꺼낸다. */
function pick(seed: number, shift: number, min: number, max: number): number {
  return min + ((seed >>> shift) % 1000) / 1000 * (max - min)
}

export function CharacterStage({ entries, limit = 12 }: CharacterStageProps) {
  const walkers = useMemo(
    () =>
      entries.slice(0, limit).map((entry) => {
        const seed = hash(entry.id)

        // lane 0 = 잔디 안쪽(멀리), 1 = 화면 앞쪽(가까이)
        const depth = pick(seed, 3, 0, 1)
        const size = Math.round(48 + depth * 38) // 멀수록 작게 — 원근감
        const from = Math.round(pick(seed, 7, 2, 30))
        const to = Math.round(pick(seed, 11, 62, 97))
        const duration = Math.round(pick(seed, 13, 22, 46)) // 천천히 거닐도록

        return {
          entry,
          style: {
            '--size': `${size}px`,
            '--lane': `${Math.round(depth * 62)}%`,
            '--from': `${from}%`,
            '--to': `calc(${to}% - ${size}px)`,
            '--duration': `${duration}s`,
            '--delay': `-${Math.round(pick(seed, 17, 0, duration))}s`,
            '--step': `${(0.52 + depth * 0.22).toFixed(2)}s`,
            zIndex: 10 + Math.round(depth * 10),
            opacity: 0.86 + depth * 0.14, // 멀리 있는 캐릭터는 옅게
          } as CSSProperties,
        }
      }),
    [entries, limit],
  )

  return (
    <div className="stage" aria-hidden="true">
      {walkers.map(({ entry, style }) => (
        <div className="walker" key={entry.id} style={style}>
          <div className="walker__flip">
            <Character mood={entry.mood} walking className="walker__svg" />
          </div>
          <span className="walker__tip">
            {formatDate(entry.date)} · {MOOD_META[entry.mood].label}
          </span>
        </div>
      ))}
    </div>
  )
}
