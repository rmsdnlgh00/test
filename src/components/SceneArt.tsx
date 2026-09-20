import { useMemo } from 'react'
import type { Uv } from '../types'
import type { UvRect } from '../lib/geometry'
import { uvToPoint } from '../lib/geometry'
import {
  BENCH_UV,
  FLOWER_BED,
  GATE_UV,
  GROUND_QUAD,
  POND,
  SVG_HEIGHT,
  SVG_WIDTH,
} from '../data/scene'
import type { ScenePalette } from '../data/season'

/**
 * 배경 디오라마를 직접 그리는 SVG (스펙 4장).
 *
 * 이미지 대신 벡터로 그리는 이유가 셋 있다.
 *  1. 잔디·연못·화단·울타리를 좌표계(GROUND_QUAD, POND, FLOWER_BED)에서 바로 그리므로
 *     그림과 판정 영역이 구조적으로 어긋날 수 없다.
 *  2. 계절 전환이 색 보정 필터가 아니라 실제 잎 색과 물든 비율로 표현된다.
 *  3. 어떤 화면 크기에서도 또렷하고, 용량이 수십 KB 수준이다.
 */

/** uv 를 SVG 작도 좌표로. 좌표계의 % 값을 그대로 환산한다. */
function at(uv: Uv) {
  const p = uvToPoint(GROUND_QUAD, uv)
  return { x: (p.x / 100) * SVG_WIDTH, y: (p.y / 100) * SVG_HEIGHT }
}

const lawnPath = (points: Uv[]) =>
  points
    .map(at)
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ') + ' Z'

/** 사각 영역을 타원으로 앉히기 위한 중심과 반지름. */
function ovalOf(rect: UvRect) {
  const center = at({ u: (rect.u0 + rect.u1) / 2, v: (rect.v0 + rect.v1) / 2 })
  const right = at({ u: rect.u1, v: (rect.v0 + rect.v1) / 2 })
  const front = at({ u: (rect.u0 + rect.u1) / 2, v: rect.v1 })
  return { cx: center.x, cy: center.y, rx: right.x - center.x, ry: front.y - center.y }
}

/** 결정적 난수 — 새로고침해도 나무와 풀 위치가 그대로여야 한다. */
function makeRandom(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

interface TreeSpec {
  x: number
  y: number
  size: number
  tone: 0 | 1 | 2
  warm: boolean
}

export function SceneArt({ palette }: { palette: ScenePalette }) {
  const backdrop = useMemo(buildBackdrop, [])
  const scatter = useMemo(buildScatter, [])

  const lawn = lawnPath([
    { u: 0, v: 0 },
    { u: 1, v: 0 },
    { u: 1, v: 1 },
    { u: 0, v: 1 },
  ])

  const frontLeft = at({ u: 0, v: 1 })
  const frontRight = at({ u: 1, v: 1 })
  const midX = (frontLeft.x + frontRight.x) / 2
  const plinth = 64

  const pond = ovalOf(POND)
  const bed = ovalOf(FLOWER_BED)

  return (
    <svg
      className="art"
      viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="art-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.skyTop} />
          <stop offset="100%" stopColor={palette.skyBottom} />
        </linearGradient>
        <linearGradient id="art-grass" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.grassTop} />
          <stop offset="100%" stopColor={palette.grassBottom} />
        </linearGradient>
        <radialGradient id="art-water" cx="0.4" cy="0.35" r="0.8">
          <stop offset="0%" stopColor={palette.water} />
          <stop offset="100%" stopColor={palette.waterDeep} />
        </radialGradient>
        <radialGradient id="art-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="35%" stopColor="#fffdf0" />
          <stop offset="72%" stopColor="#fff4c9" />
          <stop offset="100%" stopColor="rgba(255,244,201,0)" />
        </radialGradient>
        {/* 잔디 위쪽에만 빛이 닿는 느낌 */}
        <linearGradient id="art-lawn-light" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.grassLight} stopOpacity="0.55" />
          <stop offset="55%" stopColor={palette.grassLight} stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="url(#art-sky)" />
      <circle cx={1310} cy={132} r={82} fill="url(#art-sun)" />

      {/* 먼 언덕 */}
      <path
        d="M0 330 C 220 244 380 250 560 300 C 740 350 900 246 1120 282 C 1300 312 1460 268 1600 300 L1600 470 L0 470 Z"
        fill={palette.hillFar}
      />
      <path
        d="M0 376 C 240 320 420 340 620 376 C 820 412 980 334 1220 362 C 1400 382 1500 366 1600 378 L1600 500 L0 500 Z"
        fill={palette.hillNear}
      />

      {/* 구름 */}
      {backdrop.clouds.map((cloud, i) => (
        <g key={`cloud-${i}`} fill={palette.cloud} opacity={cloud.opacity}>
          <ellipse cx={cloud.x} cy={cloud.y} rx={cloud.r * 1.7} ry={cloud.r * 0.72} />
          <ellipse
            cx={cloud.x - cloud.r * 0.8}
            cy={cloud.y + cloud.r * 0.2}
            rx={cloud.r}
            ry={cloud.r * 0.62}
          />
          <ellipse
            cx={cloud.x + cloud.r * 0.75}
            cy={cloud.y + cloud.r * 0.16}
            rx={cloud.r * 0.82}
            ry={cloud.r * 0.56}
          />
        </g>
      ))}

      {/* 평면 뒤에 늘어선 나무 */}
      {backdrop.trees.map((tree, i) => (
        <Tree key={`tree-${i}`} spec={tree} palette={palette} />
      ))}

      {/* 디오라마 받침 — 잔디 평면의 두께 */}
      <path
        d={
          `M${frontLeft.x} ${frontLeft.y} L${frontRight.x} ${frontRight.y} ` +
          `L${frontRight.x} ${frontRight.y + plinth} ` +
          `Q${midX} ${frontRight.y + plinth + 28} ${frontLeft.x} ${frontLeft.y + plinth} Z`
        }
        fill={palette.soil}
      />
      <path
        d={
          `M${frontLeft.x} ${frontLeft.y + plinth * 0.5} L${frontRight.x} ${frontRight.y + plinth * 0.5} ` +
          `L${frontRight.x} ${frontRight.y + plinth} ` +
          `Q${midX} ${frontRight.y + plinth + 28} ${frontLeft.x} ${frontLeft.y + plinth} Z`
        }
        fill={palette.soilDark}
        opacity="0.5"
      />

      {/* 잔디 평면 */}
      <path d={lawn} fill="url(#art-grass)" />
      <path d={lawn} fill="url(#art-lawn-light)" />

      {/* 연못 — POND 좌표에 그대로 앉는다 */}
      <ellipse
        cx={pond.cx}
        cy={pond.cy}
        rx={pond.rx * 1.04}
        ry={pond.ry * 1.06}
        fill={palette.soilDark}
        opacity="0.3"
      />
      <ellipse cx={pond.cx} cy={pond.cy} rx={pond.rx} ry={pond.ry} fill="url(#art-water)" />
      <ellipse
        cx={pond.cx - pond.rx * 0.3}
        cy={pond.cy - pond.ry * 0.32}
        rx={pond.rx * 0.34}
        ry={pond.ry * 0.2}
        fill="#ffffff"
        opacity="0.35"
      />
      <ellipse
        cx={pond.cx + pond.rx * 0.34}
        cy={pond.cy + pond.ry * 0.28}
        rx={pond.rx * 0.18}
        ry={pond.ry * 0.11}
        fill="#ffffff"
        opacity="0.22"
      />

      {/* 화단 — FLOWER_BED 좌표에 그대로 앉는다 */}
      <ellipse cx={bed.cx} cy={bed.cy} rx={bed.rx} ry={bed.ry} fill={palette.soil} opacity="0.45" />
      {scatter.blooms.map((bloom, i) => {
        const p = at({
          u: FLOWER_BED.u0 + (FLOWER_BED.u1 - FLOWER_BED.u0) * bloom.u,
          v: FLOWER_BED.v0 + (FLOWER_BED.v1 - FLOWER_BED.v0) * bloom.v,
        })
        return (
          <g key={`bloom-${i}`}>
            <ellipse cx={p.x} cy={p.y} rx={bloom.size * 1.4} ry={bloom.size * 0.8} fill={palette.canopy[1]} />
            <circle cx={p.x} cy={p.y - bloom.size * 0.6} r={bloom.size * 0.72} fill={palette.bloom[bloom.tone]} />
          </g>
        )
      })}

      {/* 문에서 앞쪽으로 이어지는 징검돌 */}
      {scatter.stones.map((stone, i) => {
        const p = at({ u: 0.5 + stone.offset, v: stone.v })
        const scale = 0.5 + stone.v * 0.8
        return (
          <ellipse
            key={`stone-${i}`}
            cx={p.x}
            cy={p.y}
            rx={32 * scale}
            ry={13 * scale}
            fill={palette.path}
            stroke={palette.pathEdge}
            strokeWidth={2.4}
          />
        )
      })}

      <Fence palette={palette} />
      <Bench palette={palette} />

      {/* 잔디 위 풀포기 — 뒤쪽일수록 작게 */}
      {scatter.tufts.map((tuft, i) => {
        const p = at({ u: tuft.u, v: tuft.v })
        const s = 0.4 + tuft.v * 0.9
        return (
          <path
            key={`tuft-${i}`}
            d={
              `M${p.x} ${p.y} q${-5 * s} ${-9 * s} ${-9 * s} ${-13 * s} ` +
              `M${p.x} ${p.y} q${1 * s} ${-10 * s} ${2 * s} ${-15 * s} ` +
              `M${p.x} ${p.y} q${6 * s} ${-8 * s} ${10 * s} ${-12 * s}`
            }
            stroke={palette.grassLight}
            strokeWidth={2.6 * s}
            strokeLinecap="round"
            fill="none"
            opacity="0.8"
          />
        )
      })}

      {/* 가을에는 잔디에 낙엽이 떨어져 있다 */}
      {palette.fallenLeaves &&
        scatter.leaves.map((leaf, i) => {
          const p = at({ u: leaf.u, v: leaf.v })
          const s = 0.5 + leaf.v * 0.8
          return (
            <ellipse
              key={`leaf-${i}`}
              cx={p.x}
              cy={p.y}
              rx={7 * s}
              ry={4 * s}
              fill={leaf.warm ? palette.accent : palette.canopy[2]}
              opacity="0.75"
              transform={`rotate(${leaf.rotation} ${p.x} ${p.y})`}
            />
          )
        })}

      {/* 화면 좌우 앞쪽의 큰 나무 — 가까이서 들여다보는 느낌을 만든다 */}
      {backdrop.frontTrees.map((tree, i) => (
        <Tree key={`front-${i}`} spec={tree} palette={palette} />
      ))}
    </svg>
  )
}

function Tree({ spec, palette }: { spec: TreeSpec; palette: ScenePalette }) {
  const { x, y, size, tone, warm } = spec
  // 물든 잎을 계절 팔레트의 비율만큼만 섞는다 — 9월은 잎끝만, 10월은 대부분.
  const accentColor = warm ? palette.accent : palette.canopy[2]
  const trunkWidth = size * 0.15

  return (
    <g>
      <ellipse cx={x} cy={y} rx={size * 0.4} ry={size * 0.09} fill={palette.soilDark} opacity="0.18" />
      <path
        d={
          `M${x - trunkWidth} ${y} L${x - trunkWidth * 0.62} ${y - size * 0.55} ` +
          `L${x + trunkWidth * 0.62} ${y - size * 0.55} L${x + trunkWidth} ${y} Z`
        }
        fill={palette.trunk}
      />
      <path
        d={`M${x - trunkWidth * 0.3} ${y} L${x - trunkWidth * 0.2} ${y - size * 0.55} L${x + trunkWidth * 0.1} ${y - size * 0.55} L${x + trunkWidth * 0.2} ${y} Z`}
        fill={palette.trunkDark}
        opacity="0.35"
      />
      <circle cx={x} cy={y - size * 0.8} r={size * 0.38} fill={palette.canopy[tone]} />
      <circle
        cx={x - size * 0.26}
        cy={y - size * 0.64}
        r={size * 0.27}
        fill={palette.canopy[(tone + 1) % 3]}
      />
      <circle cx={x + size * 0.27} cy={y - size * 0.66} r={size * 0.25} fill={accentColor} />
      <circle
        cx={x + size * 0.05}
        cy={y - size * 1.04}
        r={size * 0.23}
        fill={palette.canopy[(tone + 2) % 3]}
      />
    </g>
  )
}

/** 잔디 뒤쪽 가장자리를 따라 세우는 울타리. 가운데는 문을 위해 비워 둔다. */
function Fence({ palette }: { palette: ScenePalette }) {
  const FENCE_V = 0.02
  const GAP_FROM = 0.43
  const GAP_TO = 0.57
  const STEPS = 24

  const posts = Array.from({ length: STEPS + 1 }, (_, i) => i / STEPS)
    .filter((u) => u <= GAP_FROM || u >= GAP_TO)
    .map((u) => at({ u, v: FENCE_V }))

  const left = at({ u: 0, v: FENCE_V })
  const gapLeft = at({ u: GAP_FROM, v: FENCE_V })
  const gapRight = at({ u: GAP_TO, v: FENCE_V })
  const right = at({ u: 1, v: FENCE_V })
  const gate = at(GATE_UV)

  const rail = (a: { x: number; y: number }, b: { x: number; y: number }, lift: number) => (
    <line
      x1={a.x}
      y1={a.y - lift}
      x2={b.x}
      y2={b.y - lift}
      stroke={palette.fence}
      strokeWidth={7}
      strokeLinecap="round"
    />
  )

  return (
    <g>
      {posts.map((post, i) => (
        <rect
          key={`post-${i}`}
          x={post.x - 5}
          y={post.y - 46}
          width={10}
          height={46}
          rx={3}
          fill={palette.fenceDark}
        />
      ))}
      {rail(left, gapLeft, 32)}
      {rail(left, gapLeft, 15)}
      {rail(gapRight, right, 32)}
      {rail(gapRight, right, 15)}

      {/* 문 — 한쪽으로 살짝 열린 채 세워 둔다 */}
      <rect x={gate.x - 48} y={gate.y - 58} width={9} height={58} rx={3} fill={palette.fenceDark} />
      <rect x={gate.x + 39} y={gate.y - 58} width={9} height={58} rx={3} fill={palette.fenceDark} />
      <g transform={`translate(${gate.x + 43} ${gate.y}) skewX(-18) translate(${-gate.x - 43} 0)`}>
        <rect x={gate.x + 2} y={gate.y - 50} width={41} height={50} rx={5} fill={palette.fence} />
        <line
          x1={gate.x + 5}
          y1={gate.y - 36}
          x2={gate.x + 40}
          y2={gate.y - 36}
          stroke={palette.fenceDark}
          strokeWidth={4}
        />
        <line
          x1={gate.x + 5}
          y1={gate.y - 17}
          x2={gate.x + 40}
          y2={gate.y - 17}
          stroke={palette.fenceDark}
          strokeWidth={4}
        />
      </g>
    </g>
  )
}

function Bench({ palette }: { palette: ScenePalette }) {
  const p = at(BENCH_UV)
  const w = 118

  return (
    <g>
      <ellipse cx={p.x} cy={p.y} rx={w * 0.5} ry={10} fill={palette.soilDark} opacity="0.2" />
      <rect x={p.x - w / 2 + 11} y={p.y - 72} width={9} height={42} fill={palette.fenceDark} />
      <rect x={p.x + w / 2 - 20} y={p.y - 72} width={9} height={42} fill={palette.fenceDark} />
      <rect x={p.x - w / 2} y={p.y - 64} width={w} height={11} rx={4} fill={palette.fence} />
      <rect x={p.x - w / 2} y={p.y - 38} width={w} height={13} rx={4} fill={palette.fence} />
      <rect x={p.x - w / 2 + 11} y={p.y - 27} width={10} height={27} fill={palette.fenceDark} />
      <rect x={p.x + w / 2 - 21} y={p.y - 27} width={10} height={27} fill={palette.fenceDark} />
    </g>
  )
}

/** 나무·구름처럼 잔디 평면 밖에 있는 요소는 SVG 좌표로 직접 배치한다. */
function buildBackdrop() {
  const random = makeRandom(20260920)

  const trees: TreeSpec[] = Array.from({ length: 17 }, (_, i) => ({
    x: 30 + (i / 16) * 1540 + (random() - 0.5) * 72,
    y: 352 + random() * 48,
    size: 150 + random() * 120,
    tone: Math.floor(random() * 3) as 0 | 1 | 2,
    warm: random() < 0.55,
  }))

  const frontTrees: TreeSpec[] = [
    { x: -30, y: 900, size: 420, tone: 0, warm: false },
    { x: 1640, y: 930, size: 450, tone: 1, warm: true },
  ]

  const clouds = [
    { x: 250, y: 118, r: 44, opacity: 0.95 },
    { x: 690, y: 76, r: 34, opacity: 0.8 },
    { x: 1030, y: 152, r: 27, opacity: 0.68 },
    { x: 1470, y: 88, r: 38, opacity: 0.85 },
  ]

  return { trees, frontTrees, clouds }
}

/** 잔디 위 요소는 uv 로 배치해 원근을 그대로 따르게 한다. */
function buildScatter() {
  const random = makeRandom(760215)

  const blooms = Array.from({ length: 24 }, () => ({
    u: random(),
    v: random(),
    size: 6 + random() * 5,
    tone: Math.floor(random() * 3) as 0 | 1 | 2,
  }))

  const stones = Array.from({ length: 7 }, (_, i) => ({
    v: 0.08 + i * 0.13,
    offset: (random() - 0.5) * 0.045,
  }))

  const tufts = Array.from({ length: 48 }, () => ({ u: random(), v: random() }))

  const leaves = Array.from({ length: 36 }, () => ({
    u: random(),
    v: random(),
    rotation: random() * 180,
    warm: random() < 0.6,
  }))

  return { blooms, stones, tufts, leaves }
}
