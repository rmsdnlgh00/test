import { useMemo } from 'react'
import { GRID_COLS, GRID_ROWS, GROUND_QUAD, isPlaceable } from '../data/scene'
import { uvToPoint } from '../lib/geometry'

/**
 * 배치 안내용 원근 격자 (스펙 8장).
 *
 * 격자는 이미지가 아니라 지면 사각형에서 계산한다. 칸을 그릴지 말지를
 * 배치 판정과 똑같은 isPlaceable로 정하므로, 눈에 보이는 격자와
 * 실제로 놓을 수 있는 자리가 어긋날 수 없다.
 * 달라붙기(스냅)는 없고 순수 시각 안내다.
 */
export function PerspectiveGrid() {
  const cells = useMemo(() => {
    const result: string[] = []
    for (let row = 0; row < GRID_ROWS; row += 1) {
      for (let col = 0; col < GRID_COLS; col += 1) {
        const u0 = col / GRID_COLS
        const u1 = (col + 1) / GRID_COLS
        const v0 = row / GRID_ROWS
        const v1 = (row + 1) / GRID_ROWS
        if (!isPlaceable({ u: (u0 + u1) / 2, v: (v0 + v1) / 2 })) continue
        const corners = [
          { u: u0, v: v0 },
          { u: u1, v: v0 },
          { u: u1, v: v1 },
          { u: u0, v: v1 },
        ].map((uv) => {
          const p = uvToPoint(GROUND_QUAD, uv)
          return `${p.x.toFixed(2)},${p.y.toFixed(2)}`
        })
        result.push(corners.join(' '))
      }
    }
    return result
  }, [])

  return (
    <svg
      className="grid"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {cells.map((points) => (
        <polygon key={points} points={points} />
      ))}
    </svg>
  )
}
