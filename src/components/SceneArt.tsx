import { useMemo } from 'react'
import type { Uv } from '../types'
import type { UvRect } from '../lib/geometry'
import { uvToPoint } from '../lib/geometry'
import {
  BENCH_SEAT,
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
 *
 * 깊이는 네 겹으로 만든다 — 먼 나무선 → 언덕 → 마당 뒤 나무 → 앞 나무.
 * 뒤로 갈수록 하늘색 안개를 덮어 색을 덜어내면, 도형 수를 늘리지 않고도
 * 공간이 깊어 보인다.
 */

/** 잎 그늘·볕. 팔레트가 어떤 색이든 같은 방식으로 얹히도록 중립색을 쓴다. */
const SHADE = '#4a3418'
const SUNLIT = '#fff6d8'

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

/** 잔디 위의 가로 띠. 잔디 결을 원근에 맞춰 그릴 때 쓴다. */
const lawnBand = (v0: number, v1: number) =>
  lawnPath([
    { u: 0, v: v0 },
    { u: 1, v: v0 },
    { u: 1, v: v1 },
    { u: 0, v: v1 },
  ])

/**
 * 잔디판의 부드러운 실루엣.
 *
 * 좌표계(GROUND_QUAD)는 사다리꼴 그대로 두고 그림만 모서리를 둥글리고 변을
 * 살짝 배부르게 휜다. 자로 그은 사다리꼴은 색을 아무리 잘 칠해도 종이를 오려
 * 붙인 것처럼 납작하게 읽힌다.
 *
 * 부풀리기는 바깥으로만 한다 — 안쪽으로 깎으면 걸어다닐 수 있는 자리(uv 0~1)가
 * 그림 밖으로 비어져 나와 캐릭터가 허공을 딛는다.
 */
function softLawnPath(inflate: number, bow: number) {
  const corners = [
    at({ u: 0, v: 0 }),
    at({ u: 1, v: 0 }),
    at({ u: 1, v: 1 }),
    at({ u: 0, v: 1 }),
  ]
  const cx = corners.reduce((sum, p) => sum + p.x, 0) / 4
  const cy = corners.reduce((sum, p) => sum + p.y, 0) / 4

  const pushOut = (px: number, py: number, by: number) => {
    const dx = px - cx
    const dy = py - cy
    const len = Math.hypot(dx, dy) || 1
    return { x: px + (dx / len) * by, y: py + (dy / len) * by }
  }

  const out = corners.map((p) => pushOut(p.x, p.y, inflate))
  // 변의 중점을 바깥으로 민 자리를 제어점으로 써서 변마다 완만한 배를 만든다.
  const control = out.map((p, i) => {
    const q = out[(i + 1) % 4]
    return pushOut((p.x + q.x) / 2, (p.y + q.y) / 2, bow)
  })

  return (
    `M${out[0].x.toFixed(1)} ${out[0].y.toFixed(1)} ` +
    control
      .map((c, i) => {
        const next = out[(i + 1) % 4]
        return `Q${c.x.toFixed(1)} ${c.y.toFixed(1)} ${next.x.toFixed(1)} ${next.y.toFixed(1)}`
      })
      .join(' ') +
    ' Z'
  )
}

/**
 * 잔디판 바깥의 공원 땅.
 *
 * 울타리 밑동(y≈345)보다 조금 위에서 시작해 화면 아래 끝까지, 좌우로도 화면
 * 끝까지 가득 찬다. 윗선을 살짝 물결치게 두면 자로 그은 띠처럼 보이지 않고,
 * 울타리 말뚝과 뒤쪽 나무들이 이 땅에 박힌 것으로 읽힌다.
 *
 * 이 선이 밑동보다 아래로 내려가면 잔디판 밖의 양옆 울타리가 공중에 뜬다 —
 * 잔디판이 사다리꼴이라 거기엔 받쳐 줄 잔디가 없기 때문이다.
 */
const MEADOW =
  `M0 ${SVG_HEIGHT} L0 340 Q400 332 800 338 Q1200 342 1600 334 L1600 ${SVG_HEIGHT} Z`

/** 그 땅의 먼 가장자리에 지는 그늘. 언덕과 맞닿는 선을 눌러 준다. */
const MEADOW_EDGE_SHADE =
  `M0 340 Q400 332 800 338 Q1200 342 1600 334 L1600 392 Q1200 404 800 400 Q400 394 0 402 Z`

/** 잎 한 장. 끝이 뾰족한 렌즈 모양이라야 동그란 점으로 보이지 않는다. */
const leafPath = (cx: number, cy: number, r: number) =>
  `M${cx} ${cy - r} Q${cx + r * 0.85} ${cy} ${cx} ${cy + r} Q${cx - r * 0.85} ${cy} ${cx} ${cy - r} Z`

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
  /** 0~1 주사위. 계절의 accentRatio 보다 작으면 물든 나무가 된다. */
  roll: number
}

/** 잔디 실루엣을 바깥으로 부풀리는 정도와 변이 휘는 정도. */
const SOFT_INFLATE = 30
const SOFT_BOW = 20

export function SceneArt({ palette }: { palette: ScenePalette }) {
  const backdrop = useMemo(buildBackdrop, [])
  const scatter = useMemo(buildScatter, [])

  const backLeft = at({ u: 0, v: 0 })
  const plinth = 44
  const softLawn = softLawnPath(SOFT_INFLATE, SOFT_BOW)

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
          <stop offset="58%" stopColor={palette.skyBottom} />
          <stop offset="100%" stopColor={palette.skyBottom} />
        </linearGradient>
        {/* 지평선에 깔리는 안개. 뒤쪽 풍경의 색을 덜어 거리를 만든다 */}
        <linearGradient id="art-haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.skyBottom} stopOpacity="0" />
          <stop offset="70%" stopColor={palette.skyBottom} stopOpacity="0.7" />
          <stop offset="100%" stopColor={palette.skyBottom} stopOpacity="0.8" />
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
          <stop offset="30%" stopColor="#fffdf0" />
          <stop offset="68%" stopColor="#fff2c0" />
          <stop offset="100%" stopColor="rgba(255,242,192,0)" />
        </radialGradient>
        {/* 해 둘레로 번지는 넓은 빛 */}
        <radialGradient id="art-sun-halo" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#fff3c8" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#fff3c8" stopOpacity="0" />
        </radialGradient>
        {/* 잔디 뒤쪽에 지는 그늘. 울타리 밑이 붕 뜨지 않게 잡아 준다 */}
        <linearGradient id="art-lawn-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={SHADE} stopOpacity="0.2" />
          <stop offset="100%" stopColor={SHADE} stopOpacity="0" />
        </linearGradient>
        {/* 잔디 앞쪽에 닿는 볕 */}
        <linearGradient id="art-lawn-light" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={palette.grassLight} stopOpacity="0.45" />
          <stop offset="100%" stopColor={palette.grassLight} stopOpacity="0" />
        </linearGradient>
        {/*
         * 접지 그림자를 흐리는 필터.
         *
         * 딱딱한 타원 그림자는 물체를 바닥에 붙여 주지 못하고 스티커처럼
         * 얹어 놓는다. 가장자리를 풀어 놓아야 그 자리에 폭 내려앉아 보인다.
         * 큰 것(잔디판)과 작은 것(벤치·돌)의 흐림 정도가 달라야 한다.
         */}
        <filter id="art-blur-lg" x="-25%" y="-60%" width="150%" height="260%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <filter id="art-blur-sm" x="-80%" y="-200%" width="260%" height="600%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        {/* 잔디판 가운데로 모이는 볕 — 평면에 완만한 부피를 준다 */}
        <radialGradient id="art-lawn-dome" cx="0.5" cy="0.42" r="0.62">
          <stop offset="0%" stopColor={SUNLIT} stopOpacity="0.34" />
          <stop offset="60%" stopColor={SUNLIT} stopOpacity="0.08" />
          <stop offset="100%" stopColor={SHADE} stopOpacity="0.14" />
        </radialGradient>
        <clipPath id="art-lawn-clip">
          <path d={softLawn} />
        </clipPath>
      </defs>

      <rect width={SVG_WIDTH} height={SVG_HEIGHT} fill="url(#art-sky)" />
      {/* 해무리가 프레임 맨 윗줄까지 번지면 위쪽 하늘 필러와 이음매가 드러난다 */}
      <circle cx={1310} cy={176} r={168} fill="url(#art-sun-halo)" />
      <circle cx={1310} cy={176} r={74} fill="url(#art-sun)" />

      {/* 구름 */}
      {backdrop.clouds.map((cloud, i) => (
        <Cloud key={`cloud-${i}`} cloud={cloud} palette={palette} />
      ))}

      {/* 하늘을 건너는 새 몇 마리 */}
      {backdrop.birds.map((bird, i) => (
        <path
          key={`bird-${i}`}
          d={
            `M${bird.x - bird.s * 2} ${bird.y} q${bird.s} ${-bird.s * 0.8} ${bird.s * 2} 0 ` +
            `q${bird.s} ${-bird.s * 0.8} ${bird.s * 2} 0`
          }
          fill="none"
          stroke={palette.trunkDark}
          strokeWidth={bird.s * 0.28}
          strokeLinecap="round"
          opacity="0.32"
        />
      ))}

      {/* 먼 언덕 */}
      <path
        d="M0 330 C 220 244 380 250 560 300 C 740 350 900 246 1120 282 C 1300 312 1460 268 1600 300 L1600 470 L0 470 Z"
        fill={palette.hillFar}
      />
      <path
        d="M0 376 C 240 320 420 340 620 376 C 820 412 980 334 1220 362 C 1400 382 1500 366 1600 378 L1600 500 L0 500 Z"
        fill={palette.hillNear}
      />

      {/* 가장 먼 나무선. 언덕 위에 서서 실루엣만 보이고 곧 안개에 잠긴다 */}
      {backdrop.farTrees.map((tree, i) => (
        <g key={`far-${i}`} opacity="0.6">
          <rect
            x={tree.x - tree.size * 0.05}
            y={tree.y - tree.size * 0.45}
            width={tree.size * 0.1}
            height={tree.size * 0.45}
            fill={palette.trunk}
          />
          <circle
            cx={tree.x}
            cy={tree.y - tree.size * 0.52}
            r={tree.size * 0.42}
            fill={palette.canopy[tree.tone]}
          />
          <circle
            cx={tree.x - tree.size * 0.3}
            cy={tree.y - tree.size * 0.34}
            r={tree.size * 0.3}
            fill={palette.canopy[tree.tone]}
          />
          <circle
            cx={tree.x + tree.size * 0.3}
            cy={tree.y - tree.size * 0.36}
            r={tree.size * 0.28}
            fill={palette.canopy[tree.tone]}
          />
        </g>
      ))}

      {/* 언덕 위로 안개를 덮어 앞뒤 거리를 벌린다 */}
      <rect x="0" y="150" width={SVG_WIDTH} height="256" fill="url(#art-haze)" />

      {/*
       * 잔디판 바깥으로 이어지는 공원 땅.
       *
       * 잔디판이 사다리꼴이라 그 좌우에는 언덕과 안개만 남아, 공원이 좌우로
       * 이어지지 않고 잘린 것처럼 보였다. 울타리 높이에서 시작해 화면 아래
       * 끝까지, 좌우로도 화면 끝까지 같은 잔디를 깐다. 잔디판보다 아주 살짝만
       * 눌러 같은 공원으로 읽히게 하고, 밝은 잔디판이 그 위에 놓인 단이 된다.
       */}
      <path d={MEADOW} fill="url(#art-grass)" />
      <path d={MEADOW} fill={SHADE} opacity="0.07" />
      {/* 먼 가장자리에 지는 나무 그늘 — 언덕과 맞닿는 선을 부드럽게 만든다 */}
      <path d={MEADOW_EDGE_SHADE} fill={SHADE} opacity="0.13" />

      {/* 공원 가장자리에 늘어선 나무 — 방금 깐 땅 위에 심는다 */}
      {backdrop.trees.map((tree, i) => (
        <Tree key={`tree-${i}`} id={`t${i}`} spec={tree} palette={palette} />
      ))}

      {/* 들판 위의 풀포기와 낙엽 — 좌우가 허전하지 않게 */}
      {scatter.meadow.map((spot, i) => (
        <path
          key={`meadow-tuft-${i}`}
          d={
            `M${spot.x} ${spot.y} q${-5 * spot.s} ${-9 * spot.s} ${-9 * spot.s} ${-13 * spot.s} ` +
            `M${spot.x} ${spot.y} q${1 * spot.s} ${-10 * spot.s} ${2 * spot.s} ${-15 * spot.s} ` +
            `M${spot.x} ${spot.y} q${6 * spot.s} ${-8 * spot.s} ${10 * spot.s} ${-12 * spot.s}`
          }
          stroke={palette.grassBottom}
          strokeWidth={2.4 * spot.s}
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />
      ))}
      {palette.fallenLeaves &&
        scatter.meadow
          .filter((spot) => spot.leaf)
          .map((spot, i) => (
            <path
              key={`meadow-leaf-${i}`}
              d={leafPath(spot.x + 14 * spot.s, spot.y + 6, 8 * spot.s)}
              fill={palette.accent}
              opacity="0.55"
              transform={`rotate(${spot.rotation} ${spot.x} ${spot.y})`}
            />
          ))}

      {/* 잔디판이 들판에 드리우는 그림자 — 단이 떠 보이지 않게 바닥에 붙인다 */}
      <path
        d={softLawn}
        fill={SHADE}
        opacity="0.2"
        transform={`translate(6 ${plinth + 12})`}
        filter="url(#art-blur-lg)"
      />

      {/*
       * 디오라마 받침 — 잔디 실루엣을 그대로 아래로 내려 두께를 만든다.
       * 예전처럼 앞모서리에만 사각 띠를 대면 잔디는 둥근데 받침만 각져서
       * 단이 따로 논다. 같은 실루엣을 겹쳐 내리면 어떤 모양이든 따라온다.
       */}
      <path d={softLawn} fill={palette.soilDark} transform={`translate(0 ${plinth * 1.35})`} />
      <path d={softLawn} fill={palette.soil} transform={`translate(0 ${plinth})`} />

      {/* 잔디 평면 */}
      <path d={softLawn} fill="url(#art-grass)" />
      {/* 가운데가 살짝 부푼 듯한 볕 — 자로 그은 평면처럼 보이지 않게 */}
      <path d={softLawn} fill="url(#art-lawn-dome)" />

      {/* 결·그늘·볕은 둥근 실루엣 안에서만 — 밖으로 새면 각진 모서리가 되살아난다 */}
      <g clipPath="url(#art-lawn-clip)">
        {/* 잔디 결. 원근을 따르는 가로 띠라 평면이 눕혀 보인다 */}
        {scatter.mowBands.map((band, i) => (
          <path
            key={`mow-${i}`}
            d={lawnBand(band.v0, band.v1)}
            fill={palette.grassLight}
            opacity="0.09"
          />
        ))}

        <path d={lawnBand(0, 0.26)} fill="url(#art-lawn-shade)" />
        <path d={lawnBand(0.62, 1)} fill="url(#art-lawn-light)" />
      </g>

      {/* 잔디 앞 모서리에 걸리는 빛 — 둥근 앞변을 따라 흐른다 */}
      <path
        d={softLawnPath(SOFT_INFLATE - 3, SOFT_BOW)}
        fill="none"
        stroke={palette.grassLight}
        strokeWidth="5"
        opacity="0.4"
        filter="url(#art-blur-sm)"
      />

      {/* 연못 — POND 좌표에 그대로 앉는다 */}
      <ellipse
        cx={pond.cx}
        cy={pond.cy}
        rx={pond.rx * 1.08}
        ry={pond.ry * 1.12}
        fill={palette.soilDark}
        opacity="0.34"
        filter="url(#art-blur-sm)"
      />
      <ellipse cx={pond.cx} cy={pond.cy} rx={pond.rx} ry={pond.ry} fill="url(#art-water)" />
      {/* 물결 한두 줄이면 수면이 물처럼 읽힌다 */}
      <path
        d={
          `M${pond.cx - pond.rx * 0.5} ${pond.cy + pond.ry * 0.14} ` +
          `q${pond.rx * 0.25} ${-7} ${pond.rx * 0.5} 0 ` +
          `q${pond.rx * 0.25} ${7} ${pond.rx * 0.5} 0`
        }
        fill="none"
        stroke="#ffffff"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.38"
      />
      <ellipse
        cx={pond.cx - pond.rx * 0.3}
        cy={pond.cy - pond.ry * 0.34}
        rx={pond.rx * 0.34}
        ry={pond.ry * 0.18}
        fill="#ffffff"
        opacity="0.4"
      />

      {/* 물가에 놓인 돌 */}
      {scatter.pondStones.map((stone, i) => (
        <ellipse
          key={`pondstone-${i}`}
          cx={pond.cx + Math.cos(stone.angle) * pond.rx * 1.06}
          cy={pond.cy + Math.sin(stone.angle) * pond.ry * 1.08}
          rx={stone.r}
          ry={stone.r * 0.62}
          fill={palette.pathEdge}
        />
      ))}

      {/* 화단 — FLOWER_BED 좌표에 그대로 앉는다 */}
      <ellipse
        cx={bed.cx}
        cy={bed.cy}
        rx={bed.rx}
        ry={bed.ry}
        fill={palette.soil}
        opacity="0.45"
        filter="url(#art-blur-sm)"
      />
      <ellipse
        cx={bed.cx}
        cy={bed.cy}
        rx={bed.rx}
        ry={bed.ry}
        fill="none"
        stroke={palette.soilDark}
        strokeWidth="3"
        opacity="0.25"
      />
      {scatter.blooms.map((bloom, i) => {
        const p = at({
          u: FLOWER_BED.u0 + (FLOWER_BED.u1 - FLOWER_BED.u0) * bloom.u,
          v: FLOWER_BED.v0 + (FLOWER_BED.v1 - FLOWER_BED.v0) * bloom.v,
        })
        return (
          <g key={`bloom-${i}`}>
            <ellipse
              cx={p.x}
              cy={p.y}
              rx={bloom.size * 1.4}
              ry={bloom.size * 0.8}
              fill={palette.canopy[2]}
              opacity="0.7"
            />
            <circle
              cx={p.x}
              cy={p.y - bloom.size * 0.6}
              r={bloom.size * 0.72}
              fill={palette.bloom[bloom.tone]}
            />
            <circle
              cx={p.x}
              cy={p.y - bloom.size * 0.6}
              r={bloom.size * 0.26}
              fill={SUNLIT}
              opacity="0.7"
            />
          </g>
        )
      })}

      {/* 문에서 앞쪽으로 이어지는 징검돌 */}
      {scatter.stones.map((stone, i) => {
        const p = at({ u: 0.5 + stone.offset, v: stone.v })
        const scale = 0.5 + stone.v * 0.8
        return (
          <g key={`stone-${i}`}>
            <ellipse
              cx={p.x}
              cy={p.y + 4 * scale}
              rx={34 * scale}
              ry={14 * scale}
              fill={SHADE}
              opacity="0.14"
              filter="url(#art-blur-sm)"
            />
            <ellipse
              cx={p.x}
              cy={p.y}
              rx={32 * scale}
              ry={13 * scale}
              fill={palette.path}
              stroke={palette.pathEdge}
              strokeWidth={2.4}
            />
          </g>
        )
      })}

      <Fence palette={palette} groundY={backLeft.y} />
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
            stroke={tuft.dark ? palette.grassBottom : palette.grassLight}
            strokeWidth={2.6 * s}
            strokeLinecap="round"
            fill="none"
            opacity="0.75"
          />
        )
      })}

      {/* 가을에는 잔디에 낙엽이 떨어져 있다 */}
      {palette.fallenLeaves &&
        scatter.leaves.map((leaf, i) => {
          const p = at({ u: leaf.u, v: leaf.v })
          const s = 0.5 + leaf.v * 0.8
          return (
            <path
              key={`leaf-${i}`}
              d={leafPath(p.x, p.y, 9 * s)}
              fill={leaf.warm ? palette.accent : palette.canopy[leaf.tone]}
              opacity="0.8"
              // 바닥에 누운 잎이라 세로로 눌러 놓고, 저마다 다른 방향으로 돌린다.
              transform={`rotate(${leaf.rotation} ${p.x} ${p.y}) translate(${p.x} ${p.y}) scale(1 0.55) translate(${-p.x} ${-p.y})`}
            />
          )
        })}

      {/*
       * 잔디판 좌우를 메우는 나무.
       *
       * 잔디판이 사다리꼴이라 양옆에는 잔디만 남아 허전했다. 잔디판 가장자리에서
       * 바깥으로 밀어 낸 자리에 심되, 깊이 순(y)으로 그려야 앞뒤가 뒤집히지 않는다.
       * 잔디판보다 나중에 그리므로 가지가 마당 위로 조금 드리운다.
       */}
      {backdrop.sideTrees.map((tree, i) => (
        <Tree key={`side-${i}`} id={`s${i}`} spec={tree} palette={palette} />
      ))}

      {/* 화면 좌우 앞쪽의 큰 나무 — 가까이서 들여다보는 느낌을 만든다 */}
      {backdrop.frontTrees.map((tree, i) => (
        <Tree key={`front-${i}`} id={`f${i}`} spec={tree} palette={palette} />
      ))}

      {/* 공중의 빛가루 — 번진 무리 위에 또렷한 심지를 얹어야 '반짝'으로 읽힌다 */}
      {scatter.motes.map((mote, i) => (
        <g key={`mote-${i}`} opacity={mote.opacity}>
          <circle
            cx={mote.x}
            cy={mote.y}
            r={mote.r * 2.1}
            fill={SUNLIT}
            opacity="0.5"
            filter="url(#art-blur-sm)"
          />
          <circle cx={mote.x} cy={mote.y} r={mote.r * 0.5} fill="#fffdf2" />
        </g>
      ))}
    </svg>
  )
}

/** 수관을 이루는 잎덩이. 나무 크기에 대한 비율로 적어 둔다. */
const CANOPY_BLOBS = [
  { dx: -0.3, dy: -0.6, r: 0.3 },
  { dx: 0.31, dy: -0.64, r: 0.28 },
  { dx: 0, dy: -0.82, r: 0.4 },
  { dx: -0.13, dy: -1.02, r: 0.24 },
  { dx: 0.15, dy: -1.03, r: 0.22 },
] as const

/**
 * 나무 한 그루.
 *
 * 잎덩이를 클립 경로로 만들어 두고 그 안에서만 그늘과 볕을 칠한다.
 * 덩어리마다 다른 색을 칠하던 예전 방식은 원이 겹친 자리마다 경계가 생겨
 * 뭉게구름처럼 보였는데, 이렇게 하면 수관 하나에 빛이 한 방향으로 든다.
 */
function Tree({ id, spec, palette }: { id: string; spec: TreeSpec; palette: ScenePalette }) {
  const { x, y, size, tone, roll } = spec
  // 물든 나무의 비율은 계절이 정한다 — 9월은 절반, 11월은 전부.
  const warm = roll < palette.accentRatio
  const base = warm ? palette.accent : palette.canopy[tone]
  // 물드는 중인 잎 얼룩. 초록 나무엔 단풍색을, 단풍 나무엔 남은 초록을 찍는다.
  const speck = warm ? palette.canopy[2] : palette.accent
  const clipId = `canopy-${id}`
  const softId = `soft-${id}`
  const trunkWidth = size * 0.13

  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          {CANOPY_BLOBS.map((blob, i) => (
            <circle key={i} cx={x + size * blob.dx} cy={y + size * blob.dy} r={size * blob.r} />
          ))}
        </clipPath>
        {/*
         * 수관 안의 그늘·볕을 흐리는 필터.
         *
         * 이게 없으면 그늘 타원의 경계가 그대로 드러나 잎덩이가 색종이를 오려
         * 붙인 것처럼 납작해 보인다. 흐린 음영이 덩어리 안에서 위아래로 옮겨
         * 가야 점토처럼 둥근 부피가 생긴다. 흐림 정도를 나무 크기에 비례시켜야
         * 작은 나무가 통째로 뭉개지지 않는다.
         */}
        <filter id={softId} x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation={size * 0.15} />
        </filter>
      </defs>

      {/* 바닥에 닿는 그림자 — 가장자리를 흐려야 나무가 바닥에 폭 앉은 것으로 읽힌다 */}
      <ellipse
        cx={x}
        cy={y}
        rx={size * 0.46}
        ry={size * 0.12}
        fill={SHADE}
        opacity="0.2"
        filter={`url(#${softId})`}
      />

      {/* 밑동이 살짝 굵은 줄기와 가지 하나 */}
      <path
        d={`M${x} ${y - size * 0.44} L${x - size * 0.19} ${y - size * 0.64}`}
        stroke={palette.trunk}
        strokeWidth={size * 0.05}
        strokeLinecap="round"
      />
      <path
        d={
          `M${x - trunkWidth} ${y} Q${x - trunkWidth * 0.5} ${y - size * 0.3} ${x - trunkWidth * 0.45} ${y - size * 0.64} ` +
          `L${x + trunkWidth * 0.45} ${y - size * 0.64} Q${x + trunkWidth * 0.5} ${y - size * 0.3} ${x + trunkWidth} ${y} Z`
        }
        fill={palette.trunk}
      />
      <path
        d={`M${x - trunkWidth * 0.6} ${y} Q${x - trunkWidth * 0.25} ${y - size * 0.3} ${x - trunkWidth * 0.22} ${y - size * 0.62}`}
        stroke={palette.trunkDark}
        strokeWidth={trunkWidth * 0.55}
        fill="none"
        opacity="0.3"
      />

      <g clipPath={`url(#${clipId})`}>
        <rect
          x={x - size * 0.85}
          y={y - size * 1.5}
          width={size * 1.7}
          height={size * 1.6}
          fill={base}
        />
        {/*
         * 그늘·볕·얼룩을 한꺼번에 흐린다. 낱낱이 선명할 때는 원이 겹친 자리마다
         * 테두리가 생겨 뭉게구름처럼 보였는데, 흐려 놓으면 빛이 위에서 한 방향으로
         * 들어와 덩어리를 감싸는 것으로 읽힌다.
         */}
        <g filter={`url(#${softId})`}>
          {/* 아래쪽 그늘 — 덩어리 배를 깊게 눌러 준다 */}
          <ellipse
            cx={x - size * 0.08}
            cy={y - size * 0.34}
            rx={size * 1.05}
            ry={size * 0.5}
            fill={SHADE}
            opacity="0.3"
          />
          {/* 위쪽 볕 */}
          <ellipse
            cx={x + size * 0.16}
            cy={y - size * 1.04}
            rx={size * 0.54}
            ry={size * 0.36}
            fill={SUNLIT}
            opacity="0.42"
          />
          {/* 물드는 잎 얼룩 */}
          <circle cx={x - size * 0.34} cy={y - size * 0.72} r={size * 0.19} fill={speck} opacity="0.5" />
          <circle cx={x + size * 0.28} cy={y - size * 0.95} r={size * 0.15} fill={speck} opacity="0.42" />
          <circle cx={x + size * 0.08} cy={y - size * 0.56} r={size * 0.13} fill={speck} opacity="0.38" />
        </g>
      </g>
    </g>
  )
}

interface CloudSpec {
  x: number
  y: number
  r: number
  opacity: number
}

function Cloud({ cloud, palette }: { cloud: CloudSpec; palette: ScenePalette }) {
  const { x, y, r } = cloud
  const puffs = (
    <>
      <ellipse cx={x} cy={y} rx={r * 1.7} ry={r * 0.72} />
      <ellipse cx={x - r * 0.8} cy={y + r * 0.2} rx={r} ry={r * 0.62} />
      <ellipse cx={x + r * 0.75} cy={y + r * 0.16} rx={r * 0.82} ry={r * 0.56} />
    </>
  )

  return (
    <g opacity={cloud.opacity}>
      {/* 아랫배에 하늘색이 비쳐야 구름이 납작한 종잇장으로 보이지 않는다 */}
      <g fill={palette.skyBottom} opacity="0.6" transform={`translate(0 ${r * 0.2})`}>
        {puffs}
      </g>
      <g fill={palette.cloud}>{puffs}</g>
    </g>
  )
}

/** 잔디 뒤쪽 가장자리를 따라 세우는 울타리. 가운데는 문을 위해 비워 둔다. */
function Fence({ palette, groundY }: { palette: ScenePalette; groundY: number }) {
  const FENCE_V = 0.02
  const GAP_FROM = 0.43
  const GAP_TO = 0.57
  const STEPS = 40

  /*
   * 울타리는 잔디판 폭에서 끝나지 않고 화면 좌우 끝까지 이어진다.
   * u 를 0~1 밖으로 넘기면 uvToPoint 가 잔디판 뒤쪽 모서리의 기울기를 그대로
   * 늘려 주므로, 눈대중 없이 같은 선 위에 말뚝이 계속 박힌다.
   */
  const U_FROM = -0.2
  const U_TO = 1.2
  const uAt = (t: number) => U_FROM + (U_TO - U_FROM) * t

  const posts = Array.from({ length: STEPS + 1 }, (_, i) => uAt(i / STEPS))
    .filter((u) => u <= GAP_FROM || u >= GAP_TO)
    .map((u) => at({ u, v: FENCE_V }))

  const left = at({ u: U_FROM, v: FENCE_V })
  const gapLeft = at({ u: GAP_FROM, v: FENCE_V })
  const gapRight = at({ u: GAP_TO, v: FENCE_V })
  const right = at({ u: U_TO, v: FENCE_V })
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
      {/* 울타리가 잔디에 드리우는 그림자 */}
      <rect
        x={left.x}
        y={groundY}
        width={right.x - left.x}
        height={9}
        fill={SHADE}
        opacity="0.12"
      />
      {posts.map((post, i) => (
        <g key={`post-${i}`}>
          <rect
            x={post.x - 5}
            y={post.y - 46}
            width={10}
            height={46}
            rx={3}
            fill={palette.fenceDark}
          />
          <rect
            x={post.x - 5}
            y={post.y - 46}
            width={4}
            height={46}
            rx={2}
            fill={SUNLIT}
            opacity="0.2"
          />
        </g>
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

/**
 * 공원 벤치.
 *
 * 앉는 높이(BENCH_SEAT)는 캐릭터 키에 맞춰 놓은 값이다 — 이걸 올리면 캐릭터가
 * 벤치에 걸터앉지 못하고 공중에 뜬다. Character 의 앉은 자세와 짝이므로 같이 본다.
 *
 * 예전 그림은 기둥에 가로 살대만 얹은 모양이라 울타리 한 조각처럼 보였다.
 * 앉는 판을 위에서 내려다본 면(사다리꼴)으로 그리고 앞면 두께와 팔걸이를 붙이면,
 * 가로 살대가 몇 개든 벤치로 읽힌다.
 */
function Bench({ palette }: { palette: ScenePalette }) {
  const p = at(BENCH_UV)
  const seatY = p.y - BENCH_SEAT
  const backY = seatY - 26
  const halfBack = 46
  const halfFront = 54

  const leg = (x: number, top: number, bottom: number, w: number) => (
    <rect x={x - w / 2} y={top} width={w} height={bottom - top} rx={2} fill={palette.fenceDark} />
  )

  return (
    <g>
      <ellipse
        cx={p.x}
        cy={p.y}
        rx={halfFront + 6}
        ry={10}
        fill={SHADE}
        opacity="0.22"
        filter="url(#art-blur-sm)"
      />

      {/* 뒷다리와 등받이 기둥 — 앉는 판보다 먼저 그려 뒤로 보낸다 */}
      {leg(p.x - halfBack + 6, seatY - 4, p.y - 5, 6)}
      {leg(p.x + halfBack - 6, seatY - 4, p.y - 5, 6)}
      {leg(p.x - halfBack + 4, backY - 4, seatY, 7)}
      {leg(p.x + halfBack - 4, backY - 4, seatY, 7)}

      {/* 등받이 살대 */}
      <rect x={p.x - halfBack} y={backY - 4} width={halfBack * 2} height={8} rx={4} fill={palette.fence} />
      <rect x={p.x - halfBack} y={backY - 4} width={halfBack * 2} height={3} rx={1.5} fill={SUNLIT} opacity="0.3" />
      <rect x={p.x - halfBack} y={backY + 9} width={halfBack * 2} height={8} rx={4} fill={palette.fence} />
      <rect x={p.x - halfBack} y={backY + 9} width={halfBack * 2} height={3} rx={1.5} fill={SUNLIT} opacity="0.3" />

      {/* 앉는 판 — 위에서 내려다본 면이라 뒤가 좁은 사다리꼴이다 */}
      <path
        d={
          `M${p.x - halfBack} ${seatY} L${p.x + halfBack} ${seatY} ` +
          `L${p.x + halfFront} ${seatY + 7} L${p.x - halfFront} ${seatY + 7} Z`
        }
        fill={palette.fence}
      />
      {/* 판자 이음선 */}
      <path
        d={`M${p.x - halfBack + 30} ${seatY} L${p.x - halfFront + 34} ${seatY + 7}`}
        stroke={palette.fenceDark}
        strokeWidth="1.4"
        opacity="0.4"
      />
      <path
        d={`M${p.x + halfBack - 30} ${seatY} L${p.x + halfFront - 34} ${seatY + 7}`}
        stroke={palette.fenceDark}
        strokeWidth="1.4"
        opacity="0.4"
      />
      {/* 앞면 두께 */}
      <rect
        x={p.x - halfFront}
        y={seatY + 7}
        width={halfFront * 2}
        height={6}
        rx={2}
        fill={palette.fenceDark}
        opacity="0.75"
      />

      {/* 팔걸이 */}
      {leg(p.x - halfFront + 5, seatY - 12, seatY + 4, 5)}
      {leg(p.x + halfFront - 5, seatY - 12, seatY + 4, 5)}
      <rect x={p.x - halfFront} y={seatY - 15} width={16} height={5} rx={2.5} fill={palette.fence} />
      <rect x={p.x + halfFront - 16} y={seatY - 15} width={16} height={5} rx={2.5} fill={palette.fence} />

      {/* 앞다리 */}
      {leg(p.x - halfFront + 8, seatY + 12, p.y, 7)}
      {leg(p.x + halfFront - 8, seatY + 12, p.y, 7)}
    </g>
  )
}

/** 나무·구름처럼 잔디 평면 밖에 있는 요소는 SVG 좌표로 직접 배치한다. */
function buildBackdrop() {
  const random = makeRandom(20260920)

  const farTrees = Array.from({ length: 22 }, (_, i) => ({
    x: -20 + (i / 21) * 1640 + (random() - 0.5) * 60,
    y: 300 + random() * 22,
    size: 74 + random() * 52,
    tone: Math.floor(random() * 3) as 0 | 1 | 2,
  }))

  const trees: TreeSpec[] = Array.from({ length: 17 }, (_, i) => ({
    x: 30 + (i / 16) * 1540 + (random() - 0.5) * 72,
    y: 352 + random() * 48,
    size: 150 + random() * 120,
    tone: Math.floor(random() * 3) as 0 | 1 | 2,
    roll: random(),
  }))

  /*
   * 잔디판 좌우의 빈 잔디를 메우는 나무.
   *
   * 자리는 잔디판 가장자리에서 뽑는다 — 사다리꼴이 기울어 있어 x 를 고정하면
   * 위쪽은 잔디를 파고들고 아래쪽은 화면 밖으로 나간다. 수관 반지름만큼
   * 더 밀어 내야 마당을 덮지 않는다.
   */
  const sideTrees: TreeSpec[] = Array.from({ length: 18 }, (_, i) => {
    const side = i % 2 === 0 ? -1 : 1
    const v = 0.04 + (Math.floor(i / 2) / 8) * 1.0 + (random() - 0.5) * 0.1
    const edge = at({ u: side < 0 ? 0 : 1, v })
    const size = 118 + v * 210 + random() * 70
    return {
      x: edge.x + side * (46 + size * 0.5 + random() * 70),
      y: edge.y + (random() - 0.5) * 26,
      size,
      tone: Math.floor(random() * 3) as 0 | 1 | 2,
      roll: random(),
    }
  })
    // 수관이 화면에 걸리지도 않는 나무는 그릴 필요가 없다.
    .filter((tree) => tree.x + tree.size > 0 && tree.x - tree.size < SVG_WIDTH)
    .sort((a, b) => a.y - b.y)

  const frontTrees: TreeSpec[] = [
    { x: -30, y: 900, size: 420, tone: 0, roll: 0.92 },
    { x: 1640, y: 930, size: 450, tone: 1, roll: 0.08 },
  ]

  const clouds: CloudSpec[] = [
    { x: 250, y: 118, r: 44, opacity: 0.95 },
    { x: 690, y: 76, r: 34, opacity: 0.8 },
    { x: 1030, y: 152, r: 27, opacity: 0.68 },
    { x: 1470, y: 88, r: 38, opacity: 0.85 },
  ]

  const birds = [
    { x: 548, y: 198, s: 9 },
    { x: 610, y: 176, s: 7 },
    { x: 664, y: 208, s: 6 },
  ]

  return { trees, farTrees, sideTrees, frontTrees, clouds, birds }
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

  const pondStones = Array.from({ length: 6 }, () => ({
    angle: random() * Math.PI * 2,
    r: 9 + random() * 7,
  }))

  const tufts = Array.from({ length: 56 }, () => ({
    u: random(),
    v: random(),
    dark: random() < 0.35,
  }))

  const leaves = Array.from({ length: 44 }, () => ({
    u: random(),
    v: random(),
    rotation: random() * 180,
    warm: random() < 0.62,
    tone: Math.floor(random() * 3) as 0 | 1 | 2,
  }))

  /** 잔디 결 — 한 칸 걸러 한 칸씩만 밝게 칠한다. */
  const mowBands = Array.from({ length: 5 }, (_, i) => ({ v0: i * 0.2, v1: i * 0.2 + 0.1 }))

  /*
   * 공중에 떠도는 빛가루.
   *
   * 도형을 늘리지 않고도 공기가 있는 것처럼 보이게 하는 가장 싼 방법이다.
   * 잔디 위부터 나무 우듬지 높이까지만 뿌려, 하늘 한복판에 먼지가 뜬 것처럼
   * 보이지 않게 한다.
   */
  const motes = Array.from({ length: 30 }, () => ({
    x: random() * SVG_WIDTH,
    y: SVG_HEIGHT * 0.26 + random() * SVG_HEIGHT * 0.52,
    r: 2.5 + random() * 4.5,
    opacity: 0.35 + random() * 0.45,
  }))

  /*
   * 들판의 풀포기. 잔디판 가장자리에서 바깥으로 밀어 내 심는다 —
   * 예전에 아무것도 없어 비어 보이던 바로 그 자리다.
   */
  const meadow = Array.from({ length: 46 }, () => {
    const side = random() < 0.5 ? -1 : 1
    const edge = at({ u: side < 0 ? 0 : 1, v: 0.1 + random() * 0.9 })
    const x = edge.x + side * (34 + random() * 300)
    const y = edge.y + (random() - 0.5) * 26
    return {
      x,
      y,
      s: 0.45 + ((y - 470) / (SVG_HEIGHT - 470)) * 0.85,
      leaf: random() < 0.45,
      rotation: random() * 180,
    }
  }).filter((spot) => spot.x > -20 && spot.x < SVG_WIDTH + 20 && spot.y > 500)

  return { blooms, stones, pondStones, tufts, leaves, mowBands, meadow, motes }
}
