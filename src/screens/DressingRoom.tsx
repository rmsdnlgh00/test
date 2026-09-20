import { useEffect, useState } from 'react'
import type { DiaryEntry, OutfitSlot } from '../types'
import { SLOT_LABEL, outfitInSlot, outfitsOfSlot } from '../data/catalog'
import { MOOD_META } from '../lib/mood'
import { formatDay, formatMonth, monthOf } from '../lib/date'
import { Sheet } from '../components/Sheet'
import { Character } from '../components/Character'
import './screens.css'

interface DressingRoomProps {
  open: boolean
  entries: DiaryEntry[]
  ownedOutfits: string[]
  onSetOutfit: (date: string, slot: OutfitSlot, itemId: string | null) => void
  onClose: () => void
}

const SLOTS: OutfitSlot[] = ['top', 'bottom']

/**
 * 꾸미기 — 의상 (스펙 2장).
 * 일기 작성 흐름과 완전히 분리되어, 과거 달의 캐릭터에게도 아무 때나 옷을 입힐 수 있다.
 * 상의와 하의를 따로 고르므로 가진 옷을 섞어 입힐 수 있다.
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
                top={outfitInSlot(entry.outfit.top, 'top')}
                bottom={outfitInSlot(entry.outfit.bottom, 'bottom')}
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
              top={outfitInSlot(selected.outfit.top, 'top')}
              bottom={outfitInSlot(selected.outfit.bottom, 'bottom')}
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

          {SLOTS.map((slot) => {
            const owned = outfitsOfSlot(slot).filter((item) => ownedOutfits.includes(item.id))
            const worn = selected.outfit[slot]

            return (
              <section key={slot} className="dress__slot">
                <h3 className="dress__slot-title display">{SLOT_LABEL[slot]}</h3>
                <div className="dress__outfits">
                  <button
                    className={`chip${worn === null ? ' is-active' : ''}`}
                    type="button"
                    onClick={() => onSetOutfit(selected.date, slot, null)}
                  >
                    벗기
                  </button>
                  {owned.map((item) => (
                    <button
                      key={item.id}
                      className={`chip${worn === item.id ? ' is-active' : ''}`}
                      type="button"
                      onClick={() => onSetOutfit(selected.date, slot, item.id)}
                    >
                      <span className="chip__swatch" style={{ background: item.color }} />
                      {item.name}
                    </button>
                  ))}
                  {owned.length === 0 && (
                    <span className="dress__none">
                      가진 {SLOT_LABEL[slot]}가 없어요. 상점에서 먼저 가져오세요.
                    </span>
                  )}
                </div>
              </section>
            )
          })}
        </>
      )}
    </Sheet>
  )
}
