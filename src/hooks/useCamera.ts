import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, RefObject } from 'react'
import { WORLD_SCALE } from '../data/scene'
import { clamp } from '../lib/geometry'

/** 월드 전체가 뷰포트 폭에 꼭 맞는 배율 — 이보다 더 축소할 이유가 없다. */
const MIN_ZOOM = 1 / WORLD_SCALE
/** 기본 배율(1)보다 조금 더 가까이 들여다볼 수 있는 정도. */
const MAX_ZOOM = 1.4

interface CameraState {
  /** 뷰포트 한가운데에 오는 월드 위의 점 (0~1, 월드 전체 대비 정규화 좌표). */
  cx: number
  cy: number
  zoom: number
}

/**
 * 드래그로 넓힌 마당을 손끝/커서로 훑어보는 카메라 (스펙: 카메라형 월드 1단계).
 *
 * 픽셀이 아니라 "뷰포트 중심이 월드의 어느 정규화 지점을 보고 있는가"로 상태를
 * 들고 있는다 — 그래야 창 크기가 바뀌어도 같은 곳을 계속 비추고, 클램프 계산이
 * 뷰포트/월드의 실제 px 크기와 무관하게 단순해진다.
 *
 * 소품을 잡은 드래그(useDecorDrag)는 그 소품에서 stopPropagation 하므로,
 * 여기 onPointerDown 은 배경을 직접 잡았을 때만 걸린다 — 모드 전환 없이도
 * 소품 옮기기와 마당 둘러보기가 저절로 갈린다.
 */
export function useCamera(viewportRef: RefObject<HTMLDivElement | null>) {
  const [state, setState] = useState<CameraState>({ cx: 0.5, cy: 0.5, zoom: 1 })
  const stateRef = useRef(state)
  stateRef.current = state

  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinchStart = useRef<{ dist: number; zoom: number } | null>(null)

  // 창 크기가 바뀌면 rect 를 다시 읽어 transform 을 다시 그려야 한다 — style은
  // useMemo가 아니라 매 렌더 계산이라, 리렌더만 걸어 주면 된다.
  const [, forceRender] = useState(0)
  useEffect(() => {
    const onResize = () => forceRender((t) => t + 1)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const viewportSize = useCallback(() => {
    const rect = viewportRef.current?.getBoundingClientRect()
    return rect && rect.width > 0 && rect.height > 0 ? { w: rect.width, h: rect.height } : null
  }, [viewportRef])

  /** 이 zoom 에서 화면에 보이는 폭(정규화)의 절반 — 팬 가능 범위를 정한다. */
  const halfVisible = (zoom: number) => Math.min(0.5, 1 / (2 * WORLD_SCALE * zoom))

  const clampState = useCallback((next: CameraState): CameraState => {
    const zoom = clamp(next.zoom, MIN_ZOOM, MAX_ZOOM)
    const half = halfVisible(zoom)
    return {
      zoom,
      cx: clamp(next.cx, half, 1 - half),
      cy: clamp(next.cy, half, 1 - half),
    }
  }, [])

  const panBy = useCallback(
    (dxPx: number, dyPx: number) => {
      const size = viewportSize()
      if (!size) return
      setState((prev) => {
        const worldW = size.w * WORLD_SCALE
        const worldH = size.h * WORLD_SCALE
        return clampState({
          ...prev,
          cx: prev.cx - dxPx / (worldW * prev.zoom),
          cy: prev.cy - dyPx / (worldH * prev.zoom),
        })
      })
    },
    [clampState, viewportSize],
  )

  /** 화면의 한 점(ax,ay, 뷰포트 기준)을 고정한 채 확대·축소한다. */
  const zoomAt = useCallback(
    (ax: number, ay: number, factor: number) => {
      const size = viewportSize()
      if (!size) return
      setState((prev) => {
        const worldW = size.w * WORLD_SCALE
        const worldH = size.h * WORLD_SCALE
        const nextZoom = clamp(prev.zoom * factor, MIN_ZOOM, MAX_ZOOM)
        const wx = prev.cx + (ax - size.w / 2) / (worldW * prev.zoom)
        const wy = prev.cy + (ay - size.h / 2) / (worldH * prev.zoom)
        return clampState({
          zoom: nextZoom,
          cx: wx - (ax - size.w / 2) / (worldW * nextZoom),
          cy: wy - (ay - size.h / 2) / (worldH * nextZoom),
        })
      })
    },
    [clampState, viewportSize],
  )

  const onPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      pinchStart.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: stateRef.current.zoom }
    }
  }, [])

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const prev = pointers.current.get(event.pointerId)
      if (!prev) return
      pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })

      if (pointers.current.size >= 2) {
        const [a, b] = [...pointers.current.values()]
        const dist = Math.hypot(a.x - b.x, a.y - b.y)
        const rect = viewportRef.current?.getBoundingClientRect()
        if (pinchStart.current && pinchStart.current.dist > 0 && rect) {
          const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
          const targetZoom = pinchStart.current.zoom * (dist / pinchStart.current.dist)
          zoomAt(mid.x - rect.left, mid.y - rect.top, targetZoom / stateRef.current.zoom)
        }
        return
      }

      panBy(event.clientX - prev.x, event.clientY - prev.y)
    }

    const onUp = (event: PointerEvent) => {
      pointers.current.delete(event.pointerId)
      if (pointers.current.size < 2) pinchStart.current = null
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [panBy, viewportRef, zoomAt])

  /*
   * 휠 줌은 네이티브 리스너로 직접 건다. React 의 onWheel 은 리액트 19에서도
   * 패시브로 붙어서, 그 안에서 preventDefault() 를 부르면 콘솔에 경고만 찍히고
   * 브라우저 기본 스크롤/확대가 그대로 살아 있다.
   */
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return

    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const rect = el.getBoundingClientRect()
      const factor = Math.exp(-event.deltaY * 0.0018)
      zoomAt(event.clientX - rect.left, event.clientY - rect.top, factor)
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [viewportRef, zoomAt])

  const size = viewportSize() ?? { w: 0, h: 0 }
  const worldW = size.w * WORLD_SCALE
  const worldH = size.h * WORLD_SCALE
  const tx = size.w / 2 - state.cx * worldW * state.zoom
  const ty = size.h / 2 - state.cy * worldH * state.zoom
  const style = { transform: `translate(${tx}px, ${ty}px) scale(${state.zoom})` }

  return { onPointerDown, style }
}
