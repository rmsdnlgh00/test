import type { Point, Uv } from '../types'
import type { UvRect } from '../lib/geometry'
import { clampUv, distance, pushOutOfRect, rectContains } from '../lib/geometry'

/** 배경 SVG 의 작도 단위. 무대 프레임은 이 비율(16:9)을 그대로 쓴다. */
export const SVG_WIDTH = 1600
export const SVG_HEIGHT = 900

/**
 * 디오라마 잔디 평면. 좌표계의 유일한 원천이다.
 *
 * 배경을 이미지가 아니라 SVG로 직접 그리기 때문에, 배경 그림과 이 좌표가
 * 같은 숫자에서 나온다 — 눈대중으로 맞출 필요가 없고 어긋날 수도 없다.
 * 뒤쪽이 좁고 앞쪽이 넓은 사다리꼴이라 원근 격자가 자연스럽게 수렴한다.
 *
 * 순서: 뒤-왼 → 뒤-오 → 앞-오 → 앞-왼
 */
export const GROUND_QUAD: readonly [Point, Point, Point, Point] = [
  { x: 20.625, y: 37.333 }, // (330, 336)
  { x: 79.375, y: 37.333 }, // (1270, 336)
  { x: 99.0, y: 90.222 }, // (1584, 812)
  { x: 1.0, y: 90.222 }, // (16, 812)
]

/** 걷는 영역 (스펙 7장). 가장자리는 소품 배치용으로 비워 둔다. */
export const WALK_BOUNDS: UvRect = { u0: 0.12, u1: 0.88, v0: 0.16, v1: 0.86 }

/** 연못·화단처럼 밟을 수도, 물건을 놓을 수도 없는 곳. 배경 그림도 이 좌표로 그린다. */
export const POND: UvRect = { u0: 0.1, u1: 0.34, v0: 0.34, v1: 0.64 }
export const FLOWER_BED: UvRect = { u0: 0.68, u1: 0.9, v0: 0.18, v1: 0.38 }

export const OBSTACLES: readonly UvRect[] = [POND, FLOWER_BED]

/** 캐릭터가 서 있을 수 있는 자리인지. */
export function isWalkable(uv: Uv): boolean {
  if (!rectContains(WALK_BOUNDS, uv)) return false
  return !OBSTACLES.some((rect) => rectContains(rect, uv))
}

/**
 * 소품을 놓을 수 있는 자리인지 (스펙 8장).
 * 지면 안이되 걷는 영역 '밖' — 울타리 안쪽 잔디 가장자리 띠가 배치 구역이 된다.
 */
export function isPlaceable(uv: Uv): boolean {
  const inGround = uv.u >= 0 && uv.u <= 1 && uv.v >= 0 && uv.v <= 1
  if (!inGround || rectContains(WALK_BOUNDS, uv)) return false
  return !OBSTACLES.some((rect) => rectContains(rect, uv))
}

/**
 * 놓을 수 없는 곳에 떨어뜨린 소품을 가장 가까운 유효 위치로 보정한다 (스펙 8장).
 *
 * 먼저 걷는 영역 밖으로 밀고, 그 과정에서 연못·화단에 걸리면 거기서 또 민다.
 * 밀어내기가 서로를 되돌리는 구석이 있을 수 있어, 실패하면 격자를 훑어
 * 원래 자리에서 가장 가까운 유효 칸으로 보낸다.
 */
export function snapToPlaceable(uv: Uv): Uv {
  const origin = clampUv(uv)
  if (isPlaceable(origin)) return origin

  let candidate = clampUv(pushOutOfRect(WALK_BOUNDS, origin, 0.02))
  for (let i = 0; i < OBSTACLES.length + 1; i += 1) {
    const blocking = OBSTACLES.find((rect) => rectContains(rect, candidate))
    if (!blocking) break
    candidate = clampUv(pushOutOfRect(blocking, candidate, 0.02))
  }
  if (isPlaceable(candidate)) return candidate

  return nearestPlaceableByScan(origin)
}

const SCAN_STEPS = 48

function nearestPlaceableByScan(origin: Uv): Uv {
  let best: Uv | null = null
  let bestDistance = Infinity
  for (let i = 0; i <= SCAN_STEPS; i += 1) {
    for (let j = 0; j <= SCAN_STEPS; j += 1) {
      const candidate = { u: i / SCAN_STEPS, v: j / SCAN_STEPS }
      if (!isPlaceable(candidate)) continue
      const d = distance(candidate, origin)
      if (d < bestDistance) {
        bestDistance = d
        best = candidate
      }
    }
  }
  // 배치 구역이 아예 없도록 좌표를 잘못 잡은 경우에만 여기로 온다.
  return best ?? origin
}

/** 원근 격자 분할 수. 배치 구역 안내용이라 스냅 기능은 없다. */
export const GRID_COLS = 16
export const GRID_ROWS = 10

/** 뒤쪽이 작아 보이도록 하는 축척 범위. */
export const SCALE_BACK = 0.62
export const SCALE_FRONT = 1.2

/** 캐릭터 기본 크기 (무대 높이 대비 %). */
export const CHARACTER_HEIGHT = 12

/** 초당 이동 속도 (uv 단위). */
export const WALK_SPEED = 0.11

export type HotspotKind = 'gate' | 'bench'

export interface Hotspot {
  id: string
  kind: HotspotKind
  /** 캐릭터가 서는 자리 */
  uv: Uv
  label: string
}

/** 배경 그림에서 문과 벤치가 놓인 자리. 핫스팟은 그 '앞'에 선다. */
export const GATE_UV: Uv = { u: 0.5, v: 0.03 }
export const BENCH_UV: Uv = { u: 0.8, v: 0.52 }

/**
 * 문·벤치 상호작용 지점 (스펙 7장).
 * 캐릭터가 여기로 걸어가 도착하면 상태가 바뀐다 — 문은 열린 표시가 켜지고,
 * 벤치는 앉은 포즈로 교체된다.
 */
export const HOTSPOTS: readonly Hotspot[] = [
  { id: 'gate', kind: 'gate', uv: { u: 0.5, v: 0.19 }, label: '울타리 문' },
  { id: 'bench-pond', kind: 'bench', uv: { u: 0.8, v: 0.57 }, label: '벤치' },
]
