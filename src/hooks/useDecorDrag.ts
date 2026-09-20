import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'
import { GROUND_QUAD, WALK_BOUNDS, snapToPlaceable } from '../data/scene'
import { clampUv, pointToUv, uvToPoint } from '../lib/geometry'

/** 서랍에서 꺼낸 소품이 처음 놓이는 자리 — 걷는 영역 앞쪽 잔디 띠. */
const DROP_IN_UV = { u: 0.5, v: (WALK_BOUNDS.v1 + 1) / 2 }

interface DecorActions {
  placeDecor: (itemId: string, x: number, y: number) => string
  moveDecor: (uid: string, x: number, y: number) => void
  removeDecor: (uid: string) => void
}

/**
 * 꾸미기 모드의 드래그 배치 (스펙 8장).
 *
 * 놓을 수 있는 자리 판정은 격자를 그릴 때와 똑같은 isPlaceable을 쓴다.
 * 걷는 영역 위에 떨어뜨리면 가장 가까운 바깥쪽으로 밀어내 보정한다.
 */
export function useDecorDrag(frameRef: RefObject<HTMLDivElement | null>, actions: DecorActions) {
  const [selectedUid, setSelectedUid] = useState<string | null>(null)
  const [draggingUid, setDraggingUid] = useState<string | null>(null)

  // 이벤트 핸들러가 매번 새로 붙지 않도록 최신 값을 ref에 담아 둔다.
  const actionsRef = useRef(actions)
  actionsRef.current = actions

  /** 포인터 위치를 무대 프레임 기준 % 좌표로. */
  const toFramePercent = useCallback(
    (clientX: number, clientY: number) => {
      const rect = frameRef.current?.getBoundingClientRect()
      if (!rect || rect.width === 0 || rect.height === 0) return null
      return {
        x: ((clientX - rect.left) / rect.width) * 100,
        y: ((clientY - rect.top) / rect.height) * 100,
      }
    },
    [frameRef],
  )

  /** 배치 구역 안으로 보정한 화면 좌표. */
  const snapIntoPlaceable = useCallback((x: number, y: number) => {
    const uv = clampUv(pointToUv(GROUND_QUAD, { x, y }))
    return uvToPoint(GROUND_QUAD, snapToPlaceable(uv))
  }, [])

  const onDecorPointerDown = useCallback(
    (uid: string, event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      setSelectedUid(uid)
      setDraggingUid(uid)
    },
    [],
  )

  useEffect(() => {
    if (!draggingUid) return

    const onMove = (event: PointerEvent) => {
      const point = toFramePercent(event.clientX, event.clientY)
      if (!point) return
      // 끄는 동안은 보정하지 않고 손끝을 그대로 따라간다.
      const uv = clampUv(pointToUv(GROUND_QUAD, point))
      const live = uvToPoint(GROUND_QUAD, uv)
      actionsRef.current.moveDecor(draggingUid, live.x, live.y)
    }

    const onUp = (event: PointerEvent) => {
      const point = toFramePercent(event.clientX, event.clientY)
      if (point) {
        const snapped = snapIntoPlaceable(point.x, point.y)
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
  }, [draggingUid, snapIntoPlaceable, toFramePercent])

  /** 서랍에서 소품을 꺼내 놓고, 바로 옮길 수 있도록 선택 상태로 만든다. */
  const addFromDrawer = useCallback((itemId: string) => {
    const spot = uvToPoint(GROUND_QUAD, DROP_IN_UV)
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
