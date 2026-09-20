import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import './Sheet.css'

interface SheetProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  /** 헤더 오른쪽에 붙는 보조 영역 (잔액 표시 등) */
  aside?: ReactNode
}

/** 화면 아래에서 올라오는 공용 패널. 일기·상점·꾸미기가 모두 이걸 쓴다. */
export function Sheet({ open, title, onClose, children, aside }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    panelRef.current?.focus()
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
      <button className="sheet__scrim" type="button" aria-label="닫기" onClick={onClose} />
      <div className="sheet__panel" ref={panelRef} tabIndex={-1}>
        <header className="sheet__header">
          <h2 className="sheet__title display">{title}</h2>
          <div className="sheet__aside">
            {aside}
            <button className="sheet__close" type="button" onClick={onClose} aria-label="닫기">
              ✕
            </button>
          </div>
        </header>
        <div className="sheet__body">{children}</div>
      </div>
    </div>
  )
}
