import type { Point, Uv } from '../types'

type Quad = readonly [Point, Point, Point, Point]

/**
 * 지면 사각형 위의 정규화 좌표(u,v)를 화면 비율(%) 좌표로 바꾼다.
 * 네 모서리를 겹선형 보간하므로, 사각형을 원근에 맞춰 찌그러뜨려 두면
 * 격자·이동·배치가 모두 같은 원근을 따르게 된다.
 */
export function uvToPoint(quad: Quad, { u, v }: Uv): Point {
  const [backLeft, backRight, frontRight, frontLeft] = quad
  const backX = backLeft.x + (backRight.x - backLeft.x) * u
  const backY = backLeft.y + (backRight.y - backLeft.y) * u
  const frontX = frontLeft.x + (frontRight.x - frontLeft.x) * u
  const frontY = frontLeft.y + (frontRight.y - frontLeft.y) * u
  return {
    x: backX + (frontX - backX) * v,
    y: backY + (frontY - backY) * v,
  }
}

const cross = (ax: number, ay: number, bx: number, by: number) => ax * by - ay * bx

/**
 * uvToPoint의 역변환. 드래그로 찍은 화면 좌표가 지면의 어디인지 알아내는 데 쓴다.
 * 겹선형 역변환은 v에 대한 2차식으로 풀린다.
 * 사각형 밖의 점이면 0~1을 벗어난 값이 그대로 나온다 (호출부에서 판정).
 */
export function pointToUv(quad: Quad, p: Point): Uv {
  const [p00, p10, p11, p01] = quad
  const ax = p00.x - p.x
  const ay = p00.y - p.y
  const bx = p10.x - p00.x
  const by = p10.y - p00.y
  const cx = p01.x - p00.x
  const cy = p01.y - p00.y
  const dx = p00.x - p10.x - p01.x + p11.x
  const dy = p00.y - p10.y - p01.y + p11.y

  const A = cross(cx, cy, dx, dy)
  const B = cross(cx, cy, bx, by) + cross(ax, ay, dx, dy)
  const C = cross(ax, ay, bx, by)

  let v: number
  if (Math.abs(A) < 1e-9) {
    // 사각형이 사다리꼴이면 2차항이 사라져 1차식이 된다.
    v = Math.abs(B) < 1e-9 ? 0 : -C / B
  } else {
    const disc = B * B - 4 * A * C
    const root = Math.sqrt(Math.max(disc, 0))
    const v1 = (-B + root) / (2 * A)
    const v2 = (-B - root) / (2 * A)
    // 0~1에 들어오는 해를 고른다. 둘 다 벗어나면 덜 벗어난 쪽.
    v = inUnit(v1) ? v1 : inUnit(v2) ? v2 : distanceToUnit(v1) <= distanceToUnit(v2) ? v1 : v2
  }

  const denomX = bx + dx * v
  const denomY = by + dy * v
  const u =
    Math.abs(denomX) > Math.abs(denomY)
      ? (-ax - cx * v) / (denomX || 1e-9)
      : (-ay - cy * v) / (denomY || 1e-9)

  return { u, v }
}

const inUnit = (n: number) => n >= -1e-6 && n <= 1 + 1e-6
const distanceToUnit = (n: number) => (n < 0 ? -n : n > 1 ? n - 1 : 0)

export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

export const clampUv = (uv: Uv): Uv => ({ u: clamp(uv.u, 0, 1), v: clamp(uv.v, 0, 1) })

/** uv 공간의 직사각형 영역. 연못·화단처럼 못 들어가는 곳을 표현할 때도 쓴다. */
export interface UvRect {
  u0: number
  u1: number
  v0: number
  v1: number
}

export const rectContains = (r: UvRect, { u, v }: Uv) =>
  u >= r.u0 && u <= r.u1 && v >= r.v0 && v <= r.v1

/** 점을 직사각형 '밖'으로 밀어낸다. 네 변 중 가장 가까운 쪽으로 내보낸다. */
export function pushOutOfRect(r: UvRect, uv: Uv, margin = 0.01): Uv {
  if (!rectContains(r, uv)) return uv
  const left = uv.u - r.u0
  const right = r.u1 - uv.u
  const up = uv.v - r.v0
  const down = r.v1 - uv.v
  const min = Math.min(left, right, up, down)
  if (min === left) return { ...uv, u: r.u0 - margin }
  if (min === right) return { ...uv, u: r.u1 + margin }
  if (min === up) return { ...uv, v: r.v0 - margin }
  return { ...uv, v: r.v1 + margin }
}

export const distance = (a: Uv, b: Uv) => Math.hypot(a.u - b.u, a.v - b.v)

/** 뒤쪽일수록 작게 보이도록 하는 원근 축척. */
export const depthScale = (v: number, back: number, front: number) => back + (front - back) * v
