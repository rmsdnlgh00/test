import type { Point, Uv } from '../types'
import type { UvRect } from '../lib/geometry'
import { clamp, clampUv, distance, pushOutOfRect, rectContains } from '../lib/geometry'

/** 배경 SVG 의 작도 단위. 무대 프레임은 이 비율(16:9)을 그대로 쓴다. */
export const SVG_WIDTH = 1600
export const SVG_HEIGHT = 900

/**
 * 디오라마 잔디 평면. 좌표계의 유일한 원천이다.
 *
 * 배경을 이미지가 아니라 SVG로 직접 그리기 때문에, 배경 그림과 이 좌표가
 * 같은 숫자에서 나온다 — 눈대중으로 맞출 필요가 없고 어긋날 수도 없다.
 * 뒤쪽이 좁고 앞쪽이 넓은 사다리꼴이라 원근 격자가 자연스럽게 수렴한다.
 * 뒤쪽 폭은 화면의 72% — 더 좁히면 좌우에 쓸모없는 쐐기만 남고, 더 넓히면
 * 원근이 사라져 평평해 보인다.
 *
 * 순서: 뒤-왼 → 뒤-오 → 앞-오 → 앞-왼
 */
export const GROUND_QUAD: readonly [Point, Point, Point, Point] = [
  { x: 14.0, y: 37.333 }, // (224, 336)
  { x: 86.0, y: 37.333 }, // (1376, 336)
  { x: 99.0, y: 90.222 }, // (1584, 812)
  { x: 1.0, y: 90.222 }, // (16, 812)
]

/**
 * 걷는 영역 (스펙 7장).
 *
 * 좌우로는 잔디 끝까지 내준다 — 가운데 좁은 띠만 오가면 마당이 넓어도
 * 캐릭터들이 한곳에 몰려 답답해 보인다. 앞뒤로만 조금 여유를 남겨,
 * 뒤쪽은 울타리에 파묻히지 않고 앞쪽은 받침 아래로 걸어 나가지 않는다.
 */
export const WALK_BOUNDS: UvRect = { u0: 0.045, u1: 0.955, v0: 0.13, v1: 0.88 }

/** 연못·화단처럼 밟을 수도, 물건을 놓을 수도 없는 곳. 배경 그림도 이 좌표로 그린다. */
export const POND: UvRect = { u0: 0.1, u1: 0.34, v0: 0.34, v1: 0.64 }
export const FLOWER_BED: UvRect = { u0: 0.68, u1: 0.9, v0: 0.18, v1: 0.38 }

export const OBSTACLES: readonly UvRect[] = [POND, FLOWER_BED]

/**
 * 소품을 놓을 수 있는 구역 (스펙 8장).
 *
 * 잔디 전체가 배치 구역이다. 예전에는 걷는 영역을 통째로 막아 가장자리 띠만
 * 남겼는데, 세로 화면에서는 그 띠가 화면 밖으로 잘려 나가 놓을 자리가 아예
 * 보이지 않았다. 캐릭터는 소품을 피해 다니지 않고 깊이 순으로 앞뒤만 가리므로,
 * 잔디 어디에 놓아도 그림이 깨지지 않는다.
 *
 * 가장자리 여백은 소품 밑동이 잔디 밖으로 삐져나가지 않을 만큼만 둔다.
 */
export const PLACE_BOUNDS: UvRect = { u0: 0.03, u1: 0.97, v0: 0.04, v1: 0.97 }

/** 캐릭터가 서 있을 수 있는 자리인지. */
export function isWalkable(uv: Uv): boolean {
  if (!rectContains(WALK_BOUNDS, uv)) return false
  return !OBSTACLES.some((rect) => rectContains(rect, uv))
}

/** 소품을 놓을 수 있는 자리인지 — 잔디 안이되 연못·화단은 뺀다. */
export function isPlaceable(uv: Uv): boolean {
  if (!rectContains(PLACE_BOUNDS, uv)) return false
  return !OBSTACLES.some((rect) => rectContains(rect, uv))
}

/**
 * 놓을 수 없는 곳에 떨어뜨린 소품을 가장 가까운 유효 위치로 보정한다 (스펙 8장).
 *
 * 잔디 안으로 먼저 당기고, 연못·화단에 걸쳐 있으면 가장 가까운 변으로 밀어낸다.
 * 밀어내기가 서로를 되돌리는 구석이 있을 수 있어, 실패하면 격자를 훑어
 * 원래 자리에서 가장 가까운 유효 칸으로 보낸다.
 */
export function snapToPlaceable(uv: Uv): Uv {
  const origin = clampToRect(uv, PLACE_BOUNDS)
  if (isPlaceable(origin)) return origin

  let candidate = origin
  for (let i = 0; i < OBSTACLES.length + 1; i += 1) {
    const blocking = OBSTACLES.find((rect) => rectContains(rect, candidate))
    if (!blocking) break
    candidate = clampToRect(pushOutOfRect(blocking, candidate, 0.02), PLACE_BOUNDS)
  }
  if (isPlaceable(candidate)) return candidate

  return nearestPlaceableByScan(origin)
}

const clampToRect = (uv: Uv, r: UvRect): Uv => ({
  u: clamp(uv.u, r.u0, r.u1),
  v: clamp(uv.v, r.v0, r.v1),
})

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
  return best ?? clampUv(origin)
}

/**
 * 서랍에서 꺼낸 소품이 처음 놓일 자리 (스펙 8장).
 *
 * 예전에는 늘 같은 한 점에 떨어뜨려서, 두 개째부터는 앞의 소품에 정확히 겹쳐
 * 쌓이고 하단 서랍에 가려 집을 수조차 없었다. 그래서 이미 놓인 소품에서 먼
 * 자리를 고르고, 서랍에 덮이지 않는 잔디 가운데 띠를 우선한다.
 */
const SPAWN_BAND: UvRect = { u0: 0.14, u1: 0.86, v0: 0.24, v1: 0.66 }
const SPAWN_COLS = 9
const SPAWN_ROWS = 5

export function findSpawnSpot(taken: readonly Uv[]): Uv {
  let best: Uv | null = null
  let bestScore = -Infinity

  for (let row = 0; row < SPAWN_ROWS; row += 1) {
    for (let col = 0; col < SPAWN_COLS; col += 1) {
      const candidate = {
        u: SPAWN_BAND.u0 + ((SPAWN_BAND.u1 - SPAWN_BAND.u0) * col) / (SPAWN_COLS - 1),
        v: SPAWN_BAND.v0 + ((SPAWN_BAND.v1 - SPAWN_BAND.v0) * row) / (SPAWN_ROWS - 1),
      }
      if (!isPlaceable(candidate)) continue

      // 이미 놓인 소품에서 멀수록 좋고, 같은 값이면 화면 가운데에 가까운 쪽.
      const nearest = taken.reduce(
        (min, uv) => Math.min(min, distance(uv, candidate)),
        Number.POSITIVE_INFINITY,
      )
      const spread = Math.min(nearest, 0.3)
      const centered = -Math.hypot(candidate.u - 0.5, candidate.v - 0.45) * 0.12
      const score = spread + centered
      if (score > bestScore) {
        bestScore = score
        best = candidate
      }
    }
  }

  return best ?? snapToPlaceable({ u: 0.5, v: 0.45 })
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

/** 배경 그림에서 문과 벤치가 놓인 자리. */
export const GATE_UV: Uv = { u: 0.5, v: 0.03 }
export const BENCH_UV: Uv = { u: 0.8, v: 0.52 }

/**
 * 벤치 앉는 판의 높이 (SVG 작도 단위, 밑동에서 위로).
 *
 * 캐릭터 키에 맞춰 놓은 값이다. 무대에 선 캐릭터는 대략 100 단위 높이라,
 * 19 면 키의 5분의 1쯤 — 앉으면 엉덩이가 살짝 내려앉고 무릎이 앞으로 접힌다.
 * 이걸 올리면 캐릭터가 걸터앉지 못하고 판 위에 뜬 것처럼 보인다.
 * SceneArt 의 Bench 와 Character 의 앉은 자세가 함께 쓰는 값이다.
 */
export const BENCH_SEAT = 19

/**
 * 문·벤치 상호작용 지점 (스펙 7장).
 * 캐릭터가 여기로 걸어가 도착하면 상태가 바뀐다 — 문은 열린 표시가 켜지고,
 * 벤치는 앉은 포즈로 교체된다. 문 핫스팟만 문 '앞'에 선다.
 */
export const HOTSPOTS: readonly Hotspot[] = [
  { id: 'gate', kind: 'gate', uv: { u: 0.5, v: 0.19 }, label: '울타리 문' },
  // 벤치와 같은 자리에 선다 — 조금이라도 앞에 서면 앉았을 때 판에서 흘러내려 보인다.
  { id: 'bench-pond', kind: 'bench', uv: BENCH_UV, label: '벤치' },
]
