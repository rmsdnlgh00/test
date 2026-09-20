import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'
import type { PlacedDecor, Point } from '../types'
import { GROUND_QUAD, findSpawnSpot, snapToPlaceable } from '../data/scene'
import { clampUv, pointToUv, uvToPoint } from '../lib/geometry'

interface DecorActions {
  placedDecor: PlacedDecor[]
  placeDecor: (itemId: string, x: number, y: number) => string
  moveDecor: (uid: string, x: number, y: number) => void
  removeDecor: (uid: string) => void
}

/**
 * 꾸미기 모드의 드래그 배치 (스펙 8장).
 *
 * 놓을 수 있는 자리 판정은 격자를 그릴 때와 똑같은 isPlaceable을 쓴다.
 * 배치 구역 밖에 떨어뜨리면 가장 가까운 유효 자리로 밀어 넣는다.
 */
export function useDecorDrag(frameRef: RefObject<HTMLDivElement | null>, actions: DecorActions) {
  const [selectedUid, setSelectedUid] = useState<string | null>(null)
  const [draggingUid, setDraggingUid] = useState<string | null>(null)

  // 이벤트 핸들러가 매번 새로 붙지 않도록 최신 값을 ref에 담아 둔다.
  const actionsRef = useRef(actions)
  actionsRef.current = actions

  /**
   * 잡은 순간의 '손끝 → 밑동' 간격. 이게 없으면 나무 우듬지를 집었는데 밑동이
   * 손끝으로 순간이동해서, 집자마자 소품이 껑충 뛰어오른 것처럼 보인다.
   */
  const grabOffset = useRef<Point>({ x: 0, y: 0 })

  /** 포인터 위치를 무대 프레임 기준 % 좌표로. */
  const toFramePercent = useCallback(
    (clientX: number, clientY: number): Point | null => {
      const rect = frameRef.current?.getBoundingClientRect()
      if (!rect || rect.width === 0 || rect.height === 0) return null
      return {
        x: ((clientX - rect.left) / rect.width) * 100,
        y: ((clientY - rect.top) / rect.height) * 100,
      }
    },
    [frameRef],
  )

  /** 잡은 간격을 더한 뒤 지면 위로 당긴 좌표. */
  const groundPointAt = useCallback(
    (clientX: number, clientY: number): Point | null => {
      const pointer = toFramePercent(clientX, clientY)
      if (!pointer) return null
      const target = { x: pointer.x + grabOffset.current.x, y: pointer.y + grabOffset.current.y }
      return uvToPoint(GROUND_QUAD, clampUv(pointToUv(GROUND_QUAD, target)))
    },
    [toFramePercent],
  )

  const onDecorPointerDown = useCallback(
    (decor: PlacedDecor, event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()

      const pointer = toFramePercent(event.clientX, event.clientY)
      grabOffset.current = pointer ? { x: decor.x - pointer.x, y: decor.y - pointer.y } : { x: 0, y: 0 }

      // 포인터를 이 요소에 묶어 둔다 — 손이 소품 밖으로 나가도 드래그가 끊기지 않는다.
      event.currentTarget.setPointerCapture?.(event.pointerId)

      setSelectedUid(decor.uid)
      setDraggingUid(decor.uid)
    },
    [toFramePercent],
  )

  useEffect(() => {
    if (!draggingUid) return

    const onMove = (event: PointerEvent) => {
      const live = groundPointAt(event.clientX, event.clientY)
      // 끄는 동안은 보정하지 않고 손끝을 그대로 따라간다.
      if (live) actionsRef.current.moveDecor(draggingUid, live.x, live.y)
    }

    const onUp = (event: PointerEvent) => {
      const dropped = groundPointAt(event.clientX, event.clientY)
      if (dropped) {
        const uv = snapToPlaceable(pointToUv(GROUND_QUAD, dropped))
        const snapped = uvToPoint(GROUND_QUAD, uv)
        actionsRef.current.moveDecor(draggingUid, snapped.x, snapped.y)
      }
      setDraggingUid(null)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [draggingUid, groundPointAt])

  /** 서랍에서 소품을 꺼내 놓고, 바로 옮길 수 있도록 선택 상태로 만든다. */
  const addFromDrawer = useCallback((itemId: string) => {
    const taken = actionsRef.current.placedDecor.map((d) =>
      pointToUv(GROUND_QUAD, { x: d.x, y: d.y }),
    )
    const spot = uvToPoint(GROUND_QUAD, findSpawnSpot(taken))
    setSelectedUid(actionsRef.current.placeDecor(itemId, spot.x, spot.y))
  }, [])

  const removeSelected = useCallback(() => {
    if (!selectedUid) return
    actionsRef.current.removeDecor(selectedUid)
    setSelectedUid(null)
  }, [selectedUid])

  const clearSelection = useCallback(() => setSelectedUid(null), [])

  return {
    selectedUid,
    draggingUid,
    onDecorPointerDown,
    addFromDrawer,
    removeSelected,
    clearSelection,
  }
}
