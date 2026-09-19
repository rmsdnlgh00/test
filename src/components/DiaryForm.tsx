import { useState } from 'react'
import type { FormEvent } from 'react'
import { detectMood, MOOD_META } from '../lib/mood'
import { todayISO } from '../lib/storage'
import { Character } from './Character'
import './DiaryForm.css'

interface DiaryFormProps {
  onSubmit: (date: string, text: string) => void
}

const MAX_LENGTH = 500

export function DiaryForm({ onSubmit }: DiaryFormProps) {
  const [date, setDate] = useState(todayISO)
  const [text, setText] = useState('')

  // 입력하는 동안 감정을 미리 보여준다. (저장 시점 판별과 같은 함수)
  const preview = detectMood(text)
  const canSubmit = text.trim().length > 0

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return
    onSubmit(date, text)
    setText('')
    setDate(todayISO())
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="form__row">
        <label className="form__label" htmlFor="diary-date">
          날짜
        </label>
        <input
          id="diary-date"
          className="form__date"
          type="date"
          value={date}
          max={todayISO()}
          onChange={(event) => setDate(event.target.value || todayISO())}
        />
      </div>

      <label className="form__label" htmlFor="diary-text">
        오늘 하루는 어땠나요?
      </label>
      <textarea
        id="diary-text"
        className="form__textarea"
        value={text}
        maxLength={MAX_LENGTH}
        rows={5}
        placeholder="예) 오랜만에 친구를 만나서 정말 즐거웠다."
        onChange={(event) => setText(event.target.value)}
      />

      <div className="form__footer">
        <div className="form__preview" aria-live="polite">
          <Character mood={preview} size={44} />
          <span>
            지금 감정: <strong>{MOOD_META[preview].label}</strong> {MOOD_META[preview].emoji}
          </span>
        </div>
        <div className="form__actions">
          <span className="form__count">
            {text.length}/{MAX_LENGTH}
          </span>
          <button className="form__submit" type="submit" disabled={!canSubmit}>
            저장하기
          </button>
        </div>
      </div>
    </form>
  )
}
