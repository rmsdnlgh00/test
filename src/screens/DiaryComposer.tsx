import { useEffect, useState } from 'react'
import type { DiaryEntry } from '../types'
import { MOOD_META } from '../lib/mood'
import { formatFullDate } from '../lib/date'
import { Sheet } from '../components/Sheet'
import './screens.css'

interface DiaryComposerProps {
  open: boolean
  date: string
  entry?: DiaryEntry
  onSubmit: (text: string) => void
  onClose: () => void
}

const MAX_LENGTH = 600

/**
 * 오늘의 일기 작성 (스펙 12장 2·3단계).
 * 하루 1개라, 이미 쓴 날이면 고쳐 쓰는 화면이 된다.
 */
export function DiaryComposer({ open, date, entry, onSubmit, onClose }: DiaryComposerProps) {
  const [text, setText] = useState('')

  // 열릴 때마다 그날의 본문을 다시 채운다.
  useEffect(() => {
    if (open) setText(entry?.text ?? '')
  }, [open, entry])

  const trimmed = text.trim()
  const canSave = trimmed.length > 0

  return (
    <Sheet open={open} title={entry ? '오늘의 기록 고치기' : '오늘의 기록'} onClose={onClose}>
      <p className="screen__caption">{formatFullDate(date)}</p>

      <textarea
        className="composer__input"
        value={text}
        maxLength={MAX_LENGTH}
        placeholder="오늘은 어떤 하루였나요?"
        onChange={(event) => setText(event.target.value)}
        aria-label="오늘의 일기"
      />

      <div className="composer__footer">
        <span className="screen__hint">
          {text.length} / {MAX_LENGTH}
        </span>
        <button
          className="btn btn--primary display"
          type="button"
          disabled={!canSave}
          onClick={() => canSave && onSubmit(trimmed)}
        >
          {entry ? '고쳐 쓰기' : '캐릭터 만들기'}
        </button>
      </div>

      {entry && (
        <p className="screen__note">
          지금 표정은 <strong>{MOOD_META[entry.mood].label}</strong> {MOOD_META[entry.mood].emoji}
          입니다. 다시 쓰면 표정만 바뀌고, 입혀 둔 옷은 그대로예요.
        </p>
      )}
    </Sheet>
  )
}
