import type { Agent } from '../types'
import {
  GRID_COLS,
  GRID_ROWS,
  GROUND_QUAD,
  HOTSPOTS,
  OBSTACLES,
  WALK_BOUNDS,
} from '../data/scene'
import { uvToPoint } from '../lib/geometry'
import type { UvRect } from '../lib/geometry'
import './DebugOverlay.css'

const toPoints = (uvs: { u: number; v: number }[]) =>
  uvs
    .map((uv) => uvToPoint(GROUND_QUAD, uv))
    .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(' ')

const rectPoints = (r: UvRect) =>
  toPoints([
    { u: r.u0, v: r.v0 },
    { u: r.u1, v: r.v0 },
    { u: r.u1, v: r.v1 },
    { u: r.u0, v: r.v1 },
  ])

/**
 * 좌표 보정 도구. 주소 끝에 ?debug=1 을 붙이면 켜진다.
 *
 * 배경 이미지를 새로 갈아끼웠을 때 data/scene.ts 의 GROUND_QUAD·WALK_BOUNDS·
 * OBSTACLES 숫자를 눈으로 보며 맞추라고 만든 것이다. 실제 판정과 같은 데이터를
 * 그대로 그리므로, 여기 보이는 그대로가 곧 판정 영역이다.
 */
export function DebugOverlay({ agents }: { agents: Agent[] }) {
  return (
    <>
      <svg className="debug" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {/* 지면 사각형 */}
        <polygon
          className="debug__ground"
          points={GROUND_QUAD.map((p) => `${p.x},${p.y}`).join(' ')}
        />
        {/* 지면 분할선 — 원근이 맞는지 확인용 */}
        {Array.from({ length: GRID_COLS - 1 }, (_, i) => {
          const u = (i + 1) / GRID_COLS
          return (
            <polyline
              key={`u${u}`}
              className="debug__line"
              points={toPoints([
                { u, v: 0 },
                { u, v: 1 },
              ])}
            />
          )
        })}
        {Array.from({ length: GRID_ROWS - 1 }, (_, i) => {
          const v = (i + 1) / GRID_ROWS
          return (
            <polyline
              key={`v${v}`}
              className="debug__line"
              points={toPoints([
                { u: 0, v },
                { u: 1, v },
              ])}
            />
          )
        })}
        {/* 걷는 영역 */}
        <polygon className="debug__walk" points={rectPoints(WALK_BOUNDS)} />
        {/* 제외 구역 */}
        {OBSTACLES.map((rect, i) => (
          <polygon key={i} className="debug__block" points={rectPoints(rect)} />
        ))}
      </svg>

      {HOTSPOTS.map((spot) => {
        const p = uvToPoint(GROUND_QUAD, spot.uv)
        return (
          <span key={spot.id} className="debug__spot" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
            {spot.label}
          </span>
        )
      })}

      <div className="debug__readout">
        <strong>scene 좌표 보정</strong>
        <span>캐릭터 {agents.length}마리</span>
        <span>초록: 지면 · 파랑: 걷는 영역 · 빨강: 제외 구역</span>
        <span>값은 src/data/scene.ts 에서 고친다</span>
      </div>
    </>
  )
}
