import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { DiaryEntry } from '../types'
import { detectMood, MOOD_META } from '../lib/mood'
import { Character } from './Character'
import './DiaryDock.css'

interface DiaryDockProps {
  /** 오늘 날짜(YYYY-MM-DD) */
  today: string
  /** 오늘 이미 저장된 기록. 있으면 "기록 완료" 상태로 바뀐다. */
  todayEntry: DiaryEntry | null
  onSubmit: (text: string) => void
}

const MAX_LENGTH = 500

/**
 * 우측 하단 고정 입력 독.
 * 접힘(버튼) ↔ 펼침(입력 카드) ↔ 오늘 기록 완료, 세 가지 상태를 가진다.
 */
export function DiaryDock({ today, todayEntry, onSubmit }: DiaryDockProps) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 펼쳐지는 순간 바로 입력할 수 있게 포커스를 옮긴다.
  useEffect(() => {
    if (open) textareaRef.current?.focus()
  }, [open])

  // Esc로 닫기
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  const preview = detectMood(text)
  const canSubmit = text.trim().length > 0

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return
    onSubmit(text)
    setText('')
    setOpen(false) // 저장하면 부드럽게 접힌다
  }

  // 오늘 기록이 있고 다시 쓰기를 누르지 않은 상태
  if (todayEntry && !open) {
    const meta = MOOD_META[todayEntry.mood]
    return (
      <div className="dock dock--done">
        <div className="dock__done-card">
          <Character mood={todayEntry.mood} size={52} />
          <div className="dock__done-body">
            <strong className="dock__done-title display">오늘의 기록 완료</strong>
            <span className="dock__done-mood">
              {meta.emoji} {meta.label} 캐릭터가 마을에 있어요
            </span>
          </div>
          <button
            className="dock__rewrite"
            type="button"
            onClick={() => {
              setText(todayEntry.text)
              setOpen(true)
            }}
          >
            고쳐 쓰기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`dock ${open ? 'dock--open' : ''}`}>
      {!open ? (
        <button className="dock__trigger display" type="button" onClick={() => setOpen(true)}>
          <span className="dock__trigger-icon" aria-hidden="true">
            ✎
          </span>
          오늘의 일기 쓰기
        </button>
      ) : (
        <form className="dock__card" onSubmit={handleSubmit}>
          <div className="dock__head">
            <span className="dock__date display">{today}</span>
            <button
              className="dock__close"
              type="button"
              onClick={() => setOpen(false)}
              aria-label="입력창 접기"
            >
              ×
            </button>
          </div>

          <textarea
            ref={textareaRef}
            className="dock__textarea"
            value={text}
            maxLength={MAX_LENGTH}
            rows={4}
            placeholder="오늘 하루는 어땠나요?"
            onChange={(event) => setText(event.target.value)}
          />

          <div className="dock__foot">
            <span className="dock__preview" aria-live="polite">
              <Character mood={preview} size={34} />
              {MOOD_META[preview].label}
            </span>
            <span className="dock__count">
              {text.length}/{MAX_LENGTH}
            </span>
            <button className="dock__save display" type="submit" disabled={!canSubmit}>
              저장
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
