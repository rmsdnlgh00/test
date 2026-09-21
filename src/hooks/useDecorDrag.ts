import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'
import type { PlacedDecor, Point } from '../types'
import { GROUND_QUAD, SCALE_BACK, SCALE_FRONT, snapToPlaceable } from '../data/scene'
import { clamp, clampUv, depthScale, pointToUv, uvToPoint } from '../lib/geometry'

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
/** 서랍에서 끌고 나와 아직 놓지 않은 소품. 미리보기를 손끝에 그리는 데 쓴다. */
export interface PlacingDecor {
  itemId: string
  clientX: number
  clientY: number
  /** 손끝이 가리키는 깊이의 원근 축척 — 미리보기를 놓였을 때 크기로 보여 준다. */
  scale: number
}

export function useDecorDrag(frameRef: RefObject<HTMLDivElement | null>, actions: DecorActions) {
  const [selectedUid, setSelectedUid] = useState<string | null>(null)
  const [draggingUid, setDraggingUid] = useState<string | null>(null)
  const [placing, setPlacing] = useState<PlacingDecor | null>(null)

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

  /**
   * 서랍에서 꾹 눌러 마당으로 끌어다 놓기.
   *
   * 예전에는 탭하면 마당 가운데에 일단 놓이고, 그걸 다시 끌어 옮기는 두 단계였다.
   * 놓자마자 엉뚱한 데 나타나니 매번 옮겨야 해서 번거로웠다. 이제 누르는 순간부터
   * 손끝을 따라오고, 마당에서 떼면 바로 그 자리에 앉는다.
   */
  const onDrawerPointerDown = useCallback(
    (itemId: string, event: ReactPointerEvent<HTMLElement>) => {
      event.preventDefault()
      event.currentTarget.setPointerCapture?.(event.pointerId)
      setPlacing({ itemId, clientX: event.clientX, clientY: event.clientY, scale: 1 })
    },
    [],
  )

  useEffect(() => {
    if (!placing) return

    const onMove = (event: PointerEvent) => {
      // 뒤쪽으로 끌수록 미리보기도 작아져, 놓기 전에 실제 크기를 가늠할 수 있다.
      const point = toFramePercent(event.clientX, event.clientY)
      const uv = point ? pointToUv(GROUND_QUAD, point) : null
      const scale = uv ? depthScale(clamp(uv.v, 0, 1), SCALE_BACK, SCALE_FRONT) : 1
      setPlacing((prev) =>
        prev ? { ...prev, clientX: event.clientX, clientY: event.clientY, scale } : prev,
      )
    }

    const onUp = (event: PointerEvent) => {
      // 서랍 위에서 손을 떼면 마음이 바뀐 것으로 보고 놓지 않는다.
      const dropTarget = document.elementFromPoint(event.clientX, event.clientY)
      const overDrawer = dropTarget?.closest('.drawer') != null
      const point = toFramePercent(event.clientX, event.clientY)

      if (!overDrawer && point) {
        const spot = uvToPoint(GROUND_QUAD, snapToPlaceable(pointToUv(GROUND_QUAD, point)))
        setSelectedUid(actionsRef.current.placeDecor(placing.itemId, spot.x, spot.y))
      }
      setPlacing(null)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [placing, toFramePercent])

  const removeSelected = useCallback(() => {
    if (!selectedUid) return
    actionsRef.current.removeDecor(selectedUid)
    setSelectedUid(null)
  }, [selectedUid])

  const clearSelection = useCallback(() => setSelectedUid(null), [])

  return {
    selectedUid,
    draggingUid,
    placing,
    onDecorPointerDown,
    onDrawerPointerDown,
    removeSelected,
    clearSelection,
  }
}
