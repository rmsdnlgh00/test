import type { Point, Uv } from '../types'
import type { UvRect } from '../lib/geometry'
import { clampUv, distance, pushOutOfRect, rectContains } from '../lib/geometry'

/**
 * 배경 디오라마의 잔디 평면을 덮는 사각형. 좌표계의 유일한 원천이다.
 * 걷는 영역·배치 구역·원근 격자가 전부 이 네 점에서 파생되므로,
 * 배경 이미지를 갈아끼우면 여기 숫자만 맞추면 나머지가 따라온다.
 *
 * 순서: 뒤-왼 → 뒤-오 → 앞-오 → 앞-왼 (시계 방향)
 * 값을 맞출 때는 주소 끝에 ?debug=1 을 붙여 실행하면
 * 지면 사각형·격자·걷는 영역이 화면에 그려진다.
 */
export const GROUND_QUAD: readonly [Point, Point, Point, Point] = [
  { x: 12, y: 56 },
  { x: 56, y: 40 },
  { x: 90, y: 62 },
  { x: 42, y: 86 },
]

/**
 * 걷는 영역 (스펙 7장). 지면 사각형 안쪽으로 살짝 여백을 둬서
 * 캐릭터가 잔디 가장자리 밖으로 걸어 나가지 않게 한다.
 */
export const WALK_BOUNDS: UvRect = { u0: 0.08, u1: 0.92, v0: 0.22, v1: 0.9 }

/**
 * 걷는 영역 안의 제외 구역. 연못·화단처럼 밟으면 안 되는 곳.
 * 배경 이미지가 바뀌면 여기도 같이 맞춘다.
 */
export const OBSTACLES: readonly UvRect[] = [
  // 왼쪽 연못 언저리
  { u0: 0.0, u1: 0.2, v0: 0.0, v1: 0.24 },
  // 가운데 징검돌 옆 화단
  { u0: 0.46, u1: 0.62, v0: 0.12, v1: 0.3 },
]

/** 캐릭터가 서 있을 수 있는 자리인지. 격자와 배치 판정도 같은 함수를 쓴다. */
export function isWalkable(uv: Uv): boolean {
  if (!rectContains(WALK_BOUNDS, uv)) return false
  return !OBSTACLES.some((rect) => rectContains(rect, uv))
}

/**
 * 소품을 놓을 수 있는 자리인지 (스펙 8장).
 * 지면 안이되 걷는 영역 '밖' — 즉 잔디 가장자리 띠가 배치 구역이 된다.
 */
export function isPlaceable(uv: Uv): boolean {
  const inGround = uv.u >= 0 && uv.u <= 1 && uv.v >= 0 && uv.v <= 1
  if (!inGround || rectContains(WALK_BOUNDS, uv)) return false
  // 연못·화단은 걸을 수도, 물건을 놓을 수도 없다.
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

/** 뒤쪽 캐릭터가 작아 보이도록 하는 축척 범위. */
export const SCALE_BACK = 0.72
export const SCALE_FRONT = 1.15

/** 캐릭터 기본 크기 (화면 높이 대비 %). */
export const CHARACTER_HEIGHT = 13

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

/**
 * 문·벤치 상호작용 지점 (스펙 7장).
 * 캐릭터가 여기로 걸어가 도착하면 상태가 바뀐다 — 문은 열린 문 오버레이가 켜지고,
 * 벤치는 앉은 포즈로 교체된다.
 */
export const HOTSPOTS: readonly Hotspot[] = [
  { id: 'gate', kind: 'gate', uv: { u: 0.3, v: 0.08 }, label: '울타리 문' },
  { id: 'bench-pond', kind: 'bench', uv: { u: 0.55, v: 0.06 }, label: '연못가 벤치' },
]

/**
 * 월별 배경 이미지 (스펙 3장).
 * 마스터 배경을 편집 모드로 파생시킨 이미지를 public/ 에 넣고 여기에 등록한다.
 * 등록되지 않은 달은 기본 배경 + 아래 색 보정으로 계절감만 낸다.
 */
export const DEFAULT_BACKGROUND = '/background.png'

export const MONTH_BACKGROUNDS: Record<string, string> = {
  // '2026-10': '/background-10.png',
}

export const backgroundFor = (month: string): string =>
  MONTH_BACKGROUNDS[month] ?? DEFAULT_BACKGROUND

/**
 * 전용 배경 이미지가 아직 없는 달에 씌우는 계절 보정.
 * 9월은 초록 우세, 10월은 완연한 가을 톤 — 스펙 3장의 무드 전환을 CSS로만 흉내 낸다.
 * 해당 달 전용 이미지가 등록되면 보정은 자동으로 꺼진다.
 */
export interface SeasonTint {
  /** 오버레이 색 */
  color: string
  /** 색조 회전 등 filter 값 */
  filter: string
}

const SEASON_TINTS: Record<number, SeasonTint> = {
  1: { color: 'rgba(190, 215, 240, 0.3)', filter: 'saturate(0.8) brightness(1.06)' },
  2: { color: 'rgba(205, 220, 240, 0.22)', filter: 'saturate(0.85) brightness(1.05)' },
  3: { color: 'rgba(255, 214, 226, 0.2)', filter: 'saturate(1.05)' },
  4: { color: 'rgba(255, 220, 232, 0.16)', filter: 'saturate(1.08)' },
  5: { color: 'rgba(214, 245, 205, 0.16)', filter: 'saturate(1.1)' },
  6: { color: 'rgba(200, 240, 215, 0.14)', filter: 'saturate(1.12)' },
  7: { color: 'rgba(198, 238, 225, 0.16)', filter: 'saturate(1.14) brightness(1.03)' },
  8: { color: 'rgba(210, 240, 210, 0.14)', filter: 'saturate(1.12)' },
  9: { color: 'rgba(232, 240, 200, 0.12)', filter: 'saturate(1.04)' },
  10: { color: 'rgba(246, 196, 138, 0.3)', filter: 'sepia(0.2) saturate(1.12)' },
  11: { color: 'rgba(230, 180, 140, 0.34)', filter: 'sepia(0.28) saturate(0.95)' },
  12: { color: 'rgba(214, 228, 245, 0.32)', filter: 'saturate(0.78) brightness(1.08)' },
}

export function seasonTintFor(month: string): SeasonTint | null {
  if (MONTH_BACKGROUNDS[month]) return null
  const index = Number(month.split('-')[1])
  return SEASON_TINTS[index] ?? null
}
