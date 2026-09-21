import type { PointerEvent as ReactPointerEvent } from 'react'
import { decorById } from '../data/catalog'
import { DecorSprite } from '../components/DecorSprite'
import './screens.css'

interface DecorDrawerProps {
  /** 아직 배치하지 않고 창고에 남아 있는 소품 id 목록 */
  available: string[]
  placedCount: number
  selectedName: string | null
  onItemPointerDown: (itemId: string, event: ReactPointerEvent<HTMLElement>) => void
  onRemoveSelected: () => void
  onDone: () => void
}

/**
 * 꾸미기 모드 하단 서랍 (스펙 8장).
 * 서랍의 소품을 꾹 눌러 마당으로 끌어다 놓으면 그 자리에 앉는다.
 */
export function DecorDrawer({
  available,
  placedCount,
  selectedName,
  onItemPointerDown,
  onRemoveSelected,
  onDone,
}: DecorDrawerProps) {
  // 서랍을 드래그해도 무대가 따라 움직이지 않도록 포인터 이벤트를 가둬 둔다.
  const stop = (event: ReactPointerEvent<HTMLDivElement>) => event.stopPropagation()

  return (
    <div className="drawer" onPointerDown={stop}>
      <div className="drawer__bar">
        <span className="drawer__title display">꾸미기</span>
        <span className="drawer__hint">
          {selectedName
            ? `${selectedName} — 끌어서 옮기세요`
            : '소품을 꾹 눌러 마당으로 끌어다 놓으세요'}
        </span>
        <div className="drawer__actions">
          {selectedName && (
            <button className="btn btn--small" type="button" onClick={onRemoveSelected}>
              거두기
            </button>
          )}
          <button className="btn btn--small btn--primary display" type="button" onClick={onDone}>
            완료
          </button>
        </div>
      </div>

      <div className="drawer__rail">
        {available.map((id) => {
          const item = decorById(id)
          if (!item) return null
          return (
            <button
              key={id}
              className="drawer__item"
              type="button"
              onPointerDown={(event) => onItemPointerDown(id, event)}
              aria-label={`${item.name} 끌어다 놓기`}
            >
              <DecorSprite art={item.art} className="drawer__sprite" />
              <span>{item.name}</span>
            </button>
          )
        })}

        {available.length === 0 && (
          <p className="drawer__empty">
            {placedCount > 0
              ? '가진 소품을 모두 놓았어요. 배치된 소품을 탭하면 옮기거나 거둘 수 있어요.'
              : '가진 소품이 없어요. 상점에서 먼저 사 오세요.'}
          </p>
        )}
      </div>
    </div>
  )
}
