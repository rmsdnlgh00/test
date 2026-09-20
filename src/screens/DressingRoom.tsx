import { useEffect, useState } from 'react'
import type { DiaryEntry } from '../types'
import { CATALOG, outfitById } from '../data/catalog'
import { MOOD_META } from '../lib/mood'
import { formatDay, formatMonth, monthOf } from '../lib/date'
import { Sheet } from '../components/Sheet'
import { Character } from '../components/Character'
import './screens.css'

interface DressingRoomProps {
  open: boolean
  entries: DiaryEntry[]
  ownedOutfits: string[]
  onSetOutfit: (date: string, outfit: string | null) => void
  onClose: () => void
}

/**
 * 꾸미기 — 의상 (스펙 2장).
 * 일기 작성 흐름과 완전히 분리되어, 과거 달의 캐릭터에게도 아무 때나 옷을 입힐 수 있다.
 */
export function DressingRoom({
  open,
  entries,
  ownedOutfits,
  onSetOutfit,
  onClose,
}: DressingRoomProps) {
  const newest = entries[entries.length - 1]
  const [selectedDate, setSelectedDate] = useState<string | null>(newest?.date ?? null)

  // 목록이 바뀌었는데 고른 캐릭터가 사라졌으면 가장 최근 캐릭터로 되돌린다.
  useEffect(() => {
    if (!open) return
    setSelectedDate((current) =>
      current && entries.some((entry) => entry.date === current)
        ? current
        : (entries[entries.length - 1]?.date ?? null),
    )
  }, [open, entries])

  const selected = entries.find((entry) => entry.date === selectedDate)
  const owned = CATALOG.filter((item) => item.type === 'outfit' && ownedOutfits.includes(item.id))

  if (entries.length === 0) {
    return (
      <Sheet open={open} title="꾸미기" onClose={onClose}>
        <p className="screen__empty">아직 캐릭터가 없어요. 일기를 쓰면 첫 캐릭터가 태어납니다.</p>
      </Sheet>
    )
  }

  return (
    <Sheet open={open} title="캐릭터 꾸미기" onClose={onClose}>
      <p className="screen__hint">옷은 아무 날짜의 캐릭터에게나 언제든 입히고 벗길 수 있어요.</p>

      <div className="dress__roster" role="listbox" aria-label="캐릭터 고르기">
        {entries
          .slice()
          .reverse()
          .map((entry) => (
            <button
              key={entry.date}
              className={`dress__pick${entry.date === selectedDate ? ' is-active' : ''}`}
              type="button"
              role="option"
              aria-selected={entry.date === selectedDate}
              onClick={() => setSelectedDate(entry.date)}
            >
              <Character
                mood={entry.mood}
                outfit={outfitById(entry.outfit)}
                className="dress__thumb"
              />
              <span className="dress__date">{formatDay(entry.date)}</span>
              <span className="dress__month">{formatMonth(monthOf(entry.date))}</span>
            </button>
          ))}
      </div>

      {selected && (
        <>
          <div className="dress__stage">
            <Character
              mood={selected.mood}
              outfit={outfitById(selected.outfit)}
              className="dress__preview"
            />
            <div className="dress__meta">
              <strong className="display">{formatDay(selected.date)}</strong>
              <span>
                {MOOD_META[selected.mood].emoji} {MOOD_META[selected.mood].label} 표정
              </span>
              <p className="dress__text">{selected.text}</p>
            </div>
          </div>

          <div className="dress__outfits">
            <button
              className={`chip${selected.outfit === null ? ' is-active' : ''}`}
              type="button"
              onClick={() => onSetOutfit(selected.date, null)}
            >
              벗기
            </button>
            {owned.map((item) => (
              <button
                key={item.id}
                className={`chip${selected.outfit === item.id ? ' is-active' : ''}`}
                type="button"
                onClick={() => onSetOutfit(selected.date, item.id)}
              >
                {item.name}
              </button>
            ))}
          </div>

          {owned.length === 0 && (
            <p className="screen__empty">가진 옷이 없어요. 상점에서 먼저 사 오세요.</p>
          )}
        </>
      )}
    </Sheet>
  )
}
