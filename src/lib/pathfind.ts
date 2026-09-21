import type { Uv } from '../types'
import { clamp } from './geometry'

/**
 * 마당 위의 길찾기 (연못·화단을 돌아가게 한다).
 *
 * 예전에는 목적지만 "걸을 수 있는 곳"으로 고르고 거기까지 직선으로 갔다.
 * 그래서 반대편으로 갈 때 연못 한가운데를 가로질러 물 위를 떠다녔다.
 *
 * 마당이 작아 격자 A* 로 충분하다 — 한 변이 40칸이라 최악의 경우도 천 칸이
 * 안 되고, 길은 목적지를 새로 고를 때만 계산한다(프레임마다가 아니다).
 */

const COLS = 40
const ROWS = 28

/** 길이 막혀 있을 때 몇 칸까지 뒤져 보고 포기할지. 무한 루프 방지용. */
const MAX_VISITS = COLS * ROWS

const cellOf = (uv: Uv) => ({
  col: clamp(Math.floor(uv.u * COLS), 0, COLS - 1),
  row: clamp(Math.floor(uv.v * ROWS), 0, ROWS - 1),
})

const centerOf = (col: number, row: number): Uv => ({
  u: (col + 0.5) / COLS,
  v: (row + 0.5) / ROWS,
})

const keyOf = (col: number, row: number) => row * COLS + col

/** 두 점을 잇는 직선이 전부 걸을 수 있는 땅 위인지. */
export function hasLineOfSight(a: Uv, b: Uv, passable: (uv: Uv) => boolean): boolean {
  const span = Math.hypot(b.u - a.u, b.v - a.v)
  const steps = Math.max(2, Math.ceil(span / 0.015))
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps
    if (!passable({ u: a.u + (b.u - a.u) * t, v: a.v + (b.v - a.v) * t })) return false
  }
  return true
}

const NEIGHBORS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
] as const

/**
 * from 에서 to 까지의 경유지 목록. 직선으로 갈 수 있으면 [to] 하나만 준다.
 *
 * 길을 못 찾으면 [to] 를 그대로 돌려준다 — 캐릭터가 제자리에 얼어붙는 것보다
 * 차라리 예전처럼 가로지르는 편이 낫다.
 */
export function findPath(from: Uv, to: Uv, passable: (uv: Uv) => boolean): Uv[] {
  if (hasLineOfSight(from, to, passable)) return [to]

  const start = cellOf(from)
  const goal = cellOf(to)
  const startKey = keyOf(start.col, start.row)
  const goalKey = keyOf(goal.col, goal.row)

  /*
   * 칸이 지나갈 수 있는지.
   *
   * 출발·도착 칸만은 칸 중심이 아니라 실제 지점으로 판정한다. 격자는 성기어서
   * 연못 바로 바깥의 멀쩡한 목적지도 칸 중심은 연못 안일 수 있는데(예: u=0.345
   * 는 중심이 0.3375 인 칸에 들어가고 연못은 u<0.34), 그러면 A* 가 도착 칸에
   * 영영 닿지 못하고 직선 예외로 떨어져 연못을 가로질러 버린다.
   */
  const cellPassable = (col: number, row: number) => {
    const key = keyOf(col, row)
    if (key === goalKey) return passable(to)
    if (key === startKey) return true
    return passable(centerOf(col, row))
  }

  const cost = new Map<number, number>([[startKey, 0]])
  const cameFrom = new Map<number, number>()
  const visited = new Set<number>()

  // 마당이 작아 우선순위 큐 대신 배열에서 최솟값을 뽑아 쓴다.
  const open: { key: number; col: number; row: number; estimate: number }[] = [
    { key: startKey, col: start.col, row: start.row, estimate: 0 },
  ]

  const heuristic = (col: number, row: number) => Math.hypot(col - goal.col, row - goal.row)

  // 도착 칸에 끝내 닿지 못했을 때 대신 갈 '가장 가까이 간 칸'.
  let nearestKey = startKey
  let nearestScore = heuristic(start.col, start.row)

  while (open.length > 0 && visited.size < MAX_VISITS) {
    let bestIndex = 0
    for (let i = 1; i < open.length; i += 1) {
      if (open[i].estimate < open[bestIndex].estimate) bestIndex = i
    }
    const current = open.splice(bestIndex, 1)[0]
    if (visited.has(current.key)) continue
    visited.add(current.key)

    const closeness = heuristic(current.col, current.row)
    if (closeness < nearestScore) {
      nearestScore = closeness
      nearestKey = current.key
    }

    if (current.key === goalKey) return smooth(from, to, cameFrom, current.key, passable, true)

    for (const [dc, dr] of NEIGHBORS) {
      const col = current.col + dc
      const row = current.row + dr
      if (col < 0 || col >= COLS || row < 0 || row >= ROWS) continue

      const key = keyOf(col, row)
      if (visited.has(key)) continue
      if (!cellPassable(col, row)) continue

      // 대각선으로 모서리를 스쳐 지나가면 장애물을 뚫고 가는 것처럼 보인다.
      if (dc !== 0 && dr !== 0) {
        if (!cellPassable(current.col + dc, current.row)) continue
        if (!cellPassable(current.col, current.row + dr)) continue
      }

      const step = dc !== 0 && dr !== 0 ? Math.SQRT2 : 1
      const next = (cost.get(current.key) ?? 0) + step
      if (next >= (cost.get(key) ?? Infinity)) continue

      cost.set(key, next)
      cameFrom.set(key, current.key)
      open.push({ key, col, row, estimate: next + heuristic(col, row) })
    }
  }

  /*
   * 도착 칸에 못 닿았다 — 격자가 성기어서 마당 맨 구석의 목적지는 칸 중심이
   * 걷는 영역 밖이라 섬처럼 고립되는 일이 있다. 그래도 곧장 직선으로 보내면
   * 연못을 가로지를 수 있으니, 갈 수 있는 데까지 간 다음 거기서 목적지로 붙는다.
   */
  if (nearestKey === startKey) return [to]
  return smooth(from, to, cameFrom, nearestKey, passable, false)
}

/**
 * 격자를 그대로 따라가면 계단처럼 꺾여 걷는 게 부자연스럽다.
 * 뒤에서부터 훑으며 한눈에 보이는 지점끼리 잇고 중간 경유지를 버린다.
 */
function smooth(
  from: Uv,
  to: Uv,
  cameFrom: Map<number, number>,
  lastKey: number,
  passable: (uv: Uv) => boolean,
  reachedGoal: boolean,
): Uv[] {
  const cells: Uv[] = []
  let key: number | undefined = lastKey
  while (key !== undefined) {
    cells.push(centerOf(key % COLS, Math.floor(key / COLS)))
    key = cameFrom.get(key)
  }
  cells.reverse()
  // 첫 칸은 지금 서 있는 자리라 다시 걸어갈 필요가 없다.
  cells.shift()
  // 도착 칸까지 갔으면 마지막 칸을 실제 목적지로 바꾸고, 못 갔으면 뒤에 덧붙인다.
  if (reachedGoal && cells.length > 0) cells[cells.length - 1] = to
  else cells.push(to)

  const path: Uv[] = []
  let anchor = from
  let index = 0
  while (index < cells.length) {
    // 이 지점에서 직선으로 갈 수 있는 가장 먼 칸까지 건너뛴다.
    let furthest = index
    for (let probe = cells.length - 1; probe > index; probe -= 1) {
      if (hasLineOfSight(anchor, cells[probe], passable)) {
        furthest = probe
        break
      }
    }
    path.push(cells[furthest])
    anchor = cells[furthest]
    index = furthest + 1
  }

  return path
}
