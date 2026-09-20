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
  /** 열릴 때 패널로 포커스를 옮길지. 안에서 직접 포커스를 잡는 화면은 끈다. */
  autoFocus?: boolean
}

/** 화면 아래에서 올라오는 공용 패널. 일기·상점·꾸미기가 모두 이걸 쓴다. */
export function Sheet({ open, title, onClose, children, aside, autoFocus = true }: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  /*
   * onClose 는 호출부에서 매 렌더 새로 만들어지는 경우가 많다. 그대로 의존성에 넣으면
   * 홈 화면의 애니메이션 리렌더마다 이 이펙트가 다시 돌아 입력 중인 요소에서
   * 포커스를 빼앗는다. 그래서 최신 콜백은 ref로만 들고 리스너는 한 번만 붙인다.
   */
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  // 포커스 이동은 '열리는 순간' 한 번뿐이어야 한다.
  useEffect(() => {
    if (open && autoFocus) panelRef.current?.focus()
  }, [open, autoFocus])

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
