import { forwardRef, useMemo, useRef } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import type { Agent, PlacedDecor } from '../types'
import {
  CHARACTER_HEIGHT,
  GROUND_QUAD,
  HOTSPOTS,
  SCALE_BACK,
  SCALE_FRONT,
} from '../data/scene'
import { depthScale, pointToUv, uvToPoint } from '../lib/geometry'
import { decorById, outfitInSlot } from '../data/catalog'
import { paletteFor } from '../data/season'
import { mixHex } from '../lib/color'
import { useCamera } from '../hooks/useCamera'
import { SceneBackground } from './SceneBackground'
import { FallingLeaves } from './FallingLeaves'
import { PerspectiveGrid } from './PerspectiveGrid'
import { DecorSprite } from './DecorSprite'
import { Character } from './Character'
import { DebugOverlay } from './DebugOverlay'
import './Stage.css'

/** 캐릭터 SVG에서 발이 닿는 높이(아래에서부터 %). */
const CHARACTER_FOOT_INSET = 7

interface StageProps {
  month: string
  agents: Agent[]
  placed: PlacedDecor[]
  /** 꾸미기 모드에서만 격자를 보여주고, 무대를 서랍 위로 살짝 들어올린다 */
  decorating?: boolean
  debug?: boolean
  draggingUid?: string | null
  selectedUid?: string | null
  onDecorPointerDown?: (decor: PlacedDecor, event: ReactPointerEvent<HTMLDivElement>) => void
}

/** 정렬 대상 — 소품과 캐릭터를 한 배열에 섞어 깊이순으로 세운다. */
type Sprite =
  | { kind: 'decor'; key: string; y: number; decor: PlacedDecor }
  | { kind: 'agent'; key: string; y: number; agent: Agent }

/**
 * 배경 + 소품 + 캐릭터가 함께 서는 무대.
 *
 * 배경 이미지는 화면을 cover로 덮는데, 좌표가 화면 기준이면 이미지가 잘릴 때
 * 잔디 위치와 어긋난다. 그래서 이미지 비율과 똑같은 프레임을 먼저 cover 크기로 깔고,
 * 모든 % 좌표를 그 프레임 기준으로 잡는다. 화면 비율이 바뀌어도 좌표가 잔디에 붙어 있다.
 *
 * 꾸미기 모드에서는 프레임을 조금 줄여 올린다. 하단 서랍이 잔디 앞쪽을 덮어 버리면
 * 거기 놓인 소품을 집을 수 없기 때문이다. 좌표는 프레임의 실제 사각형(getBoundingClientRect)
 * 에서 다시 계산되므로, 줄여도 드래그 좌표는 잔디에 그대로 붙어 있다.
 */
export const Stage = forwardRef<HTMLDivElement, StageProps>(function Stage(
  {
    month,
    agents,
    placed,
    decorating = false,
    debug = false,
    draggingUid,
    selectedUid,
    onDecorPointerDown,
  },
  frameRef,
) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const camera = useCamera(viewportRef)

  /** 깊이(화면상 아래쪽일수록 앞) 순으로 정렬 — 스펙 8장의 z-index 규칙. */
  const sprites = useMemo<Sprite[]>(() => {
    const decorSprites: Sprite[] = placed.map((d) => ({
      kind: 'decor',
      key: d.uid,
      y: d.y,
      decor: d,
    }))
    const agentSprites: Sprite[] = agents.map((agent) => ({
      kind: 'agent',
      key: agent.date,
      y: uvToPoint(GROUND_QUAD, agent.uv).y,
      agent,
    }))
    return [...decorSprites, ...agentSprites].sort((a, b) => a.y - b.y)
  }, [placed, agents])

  /*
   * 프레임 밖을 메울 색.
   *
   * 세로로 긴 화면에서는 장면 전체를 보여 주려고 프레임 폭을 화면에 맞추는데,
   * 그러면 16:9 프레임이 화면 가운데 띠만 차지하고 위아래가 빈다. 그 위아래를
   * 그림의 맨 윗줄(하늘)·맨 아랫줄(들판)과 같은 색으로 채워 한 장면처럼 잇는다.
   * SceneArt 가 들판을 SHADE 7% 로 눌러 그리므로 여기서도 같은 값을 쓴다.
   */
  const sceneVars = useMemo(() => {
    const palette = paletteFor(month)
    const ground = mixHex(palette.grassBottom, '#4a3418', 0.07)
    return {
      '--scene-sky': palette.skyTop,
      '--scene-sky-high': mixHex(palette.skyTop, '#1d4d70', 0.16),
      '--scene-ground': ground,
      '--scene-ground-deep': mixHex(ground, '#4a3418', 0.22),
    } as CSSProperties
  }, [month])

  const palette = useMemo(() => paletteFor(month), [month])

  const openGates = useMemo(
    () =>
      HOTSPOTS.filter(
        (spot) =>
          spot.kind === 'gate' &&
          agents.some((agent) => agent.hotspot === spot.id && agent.activity === 'atGate'),
      ),
    [agents],
  )

  return (
    <div className={decorating ? 'stage is-decorating' : 'stage'} style={sceneVars}>
      <div className="stage__viewport" ref={viewportRef} onPointerDown={camera.onPointerDown}>
        <div className="stage__world" ref={frameRef} style={camera.style}>
          <SceneBackground month={month} />

          {decorating && <PerspectiveGrid />}

          {/* 문 앞에 캐릭터가 서면 문이 열린 표시가 켜진다 */}
          {openGates.map((spot) => {
            const p = uvToPoint(GROUND_QUAD, spot.uv)
            return (
              <span
                key={spot.id}
                className="stage__gate-open"
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                aria-hidden="true"
              />
            )
          })}

          {sprites.map((sprite) =>
            sprite.kind === 'decor' ? (
              <DecorPiece
                key={sprite.key}
                decor={sprite.decor}
                dragging={draggingUid === sprite.key}
                selected={selectedUid === sprite.key}
                onPointerDown={onDecorPointerDown}
              />
            ) : (
              <AgentPiece key={sprite.key} agent={sprite.agent} />
            ),
          )}

          {debug && <DebugOverlay agents={agents} />}
        </div>
      </div>

      {/* 잎과 질감은 프레임이 아니라 화면 전체에 덮는다 */}
      {palette.fallenLeaves && <FallingLeaves palette={palette} />}
      <div className="stage__light" aria-hidden="true" />
      <div className="stage__grain" aria-hidden="true" />
    </div>
  )
})

function DecorPiece({
  decor,
  dragging,
  selected,
  onPointerDown,
}: {
  decor: PlacedDecor
  dragging: boolean
  selected: boolean
  onPointerDown?: (decor: PlacedDecor, event: ReactPointerEvent<HTMLDivElement>) => void
}) {
  const item = decorById(decor.itemId)
  if (!item) return null

  // 뒤에 놓을수록 작게 — 캐릭터와 같은 원근 축척을 쓴다.
  const { v } = pointToUv(GROUND_QUAD, { x: decor.x, y: decor.y })
  const scale = depthScale(Math.min(Math.max(v, 0), 1), SCALE_BACK, SCALE_FRONT)

  return (
    <div
      className={[
        'stage__piece',
        onPointerDown ? 'stage__piece--decor' : '',
        selected ? 'is-selected' : '',
        dragging ? 'is-dragging' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        left: `${decor.x}%`,
        top: `${decor.y}%`,
        height: `${item.height * scale}%`,
        aspectRatio: `${item.width} / ${item.height}`,
        // 밑동이 배치 좌표에 정확히 오도록 스프라이트 하단 여백만큼 끌어내린다.
        transform: `translate(-50%, -${100 - item.anchorY}%)`,
      }}
      onPointerDown={onPointerDown ? (event) => onPointerDown(decor, event) : undefined}
      role={onPointerDown ? 'button' : undefined}
      tabIndex={onPointerDown ? 0 : undefined}
      aria-label={onPointerDown ? `${item.name} 옮기기` : undefined}
    >
      <DecorSprite art={item.art} className="stage__art" />
    </div>
  )
}

function AgentPiece({ agent }: { agent: Agent }) {
  const p = uvToPoint(GROUND_QUAD, agent.uv)
  const scale = depthScale(agent.uv.v, SCALE_BACK, SCALE_FRONT)

  return (
    <div
      className="stage__piece"
      style={{
        left: `${p.x}%`,
        top: `${p.y}%`,
        height: `${CHARACTER_HEIGHT * scale}%`,
        aspectRatio: '1',
        transform: `translate(-50%, -${100 - CHARACTER_FOOT_INSET}%)`,
      }}
    >
      <Character
        mood={agent.mood}
        top={outfitInSlot(agent.outfit.top, 'top')}
        bottom={outfitInSlot(agent.outfit.bottom, 'bottom')}
        activity={agent.activity}
        facing={agent.facing}
        className="stage__art"
      />
    </div>
  )
}
