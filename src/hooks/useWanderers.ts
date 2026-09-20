import { useEffect, useRef, useState } from 'react'
import type { Agent, DiaryEntry, Uv } from '../types'
import { HOTSPOTS, WALK_BOUNDS, WALK_SPEED, isWalkable } from '../data/scene'

const ARRIVE_EPSILON = 0.012
/** 다음 목적지를 고를 때 핫스팟(문·벤치)을 택할 확률. */
const HOTSPOT_CHANCE = 0.35

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min)

/** 걷는 영역 안의 아무 자리나. 제외 구역에 걸리면 몇 번 더 굴린다. */
function randomSpot(): Uv {
  for (let i = 0; i < 24; i += 1) {
    const uv = {
      u: randomBetween(WALK_BOUNDS.u0, WALK_BOUNDS.u1),
      v: randomBetween(WALK_BOUNDS.v0, WALK_BOUNDS.v1),
    }
    if (isWalkable(uv)) return uv
  }
  // 전부 실패하면 영역 한가운데 — 좌표를 잘못 잡아도 캐릭터가 사라지진 않게.
  return {
    u: (WALK_BOUNDS.u0 + WALK_BOUNDS.u1) / 2,
    v: (WALK_BOUNDS.v0 + WALK_BOUNDS.v1) / 2,
  }
}

function createAgent(entry: DiaryEntry): Agent {
  const spot = randomSpot()
  return {
    date: entry.date,
    mood: entry.mood,
    outfit: entry.outfit,
    uv: spot,
    target: spot,
    activity: 'idle',
    wait: randomBetween(0.3, 2.5),
    facing: 1,
    hotspot: null,
  }
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * 홈 화면 캐릭터들의 자율 이동 (스펙 7장).
 *
 * 성능을 위해 에이전트 배열은 ref에서 직접 수정하고, 프레임마다 tick만 올려
 * 다시 그리게 한다. 렌더 쪽은 매 프레임 uv를 읽어 화면 좌표로 환산한다.
 */
export function useWanderers(entries: DiaryEntry[], enabled: boolean) {
  const agentsRef = useRef<Agent[]>([])
  const [, setTick] = useState(0)

  // 기록이 바뀌면 에이전트 목록을 맞춘다. 이미 있던 캐릭터는 위치를 유지한다.
  useEffect(() => {
    const byDate = new Map(agentsRef.current.map((agent) => [agent.date, agent]))
    agentsRef.current = entries.map((entry) => {
      const existing = byDate.get(entry.date)
      if (!existing) return createAgent(entry)
      // 표정과 옷은 최신 기록을 따라간다.
      existing.mood = entry.mood
      existing.outfit = entry.outfit
      return existing
    })
    setTick((t) => t + 1)
  }, [entries])

  useEffect(() => {
    if (!enabled) return
    if (prefersReducedMotion()) {
      // 움직임을 줄여 달라고 한 사용자에게는 제자리에 서 있게 한다.
      for (const agent of agentsRef.current) {
        agent.activity = 'idle'
        agent.target = agent.uv
      }
      setTick((t) => t + 1)
      return
    }

    let frame = 0
    let previous = performance.now()

    const step = (now: number) => {
      // 탭을 오래 비웠다 돌아오면 dt가 튀므로 상한을 둔다.
      const dt = Math.min((now - previous) / 1000, 0.1)
      previous = now

      const taken = new Set(
        agentsRef.current.map((agent) => agent.hotspot).filter((id): id is string => id !== null),
      )

      for (const agent of agentsRef.current) {
        if (agent.activity === 'walking') {
          const du = agent.target.u - agent.uv.u
          const dv = agent.target.v - agent.uv.v
          const dist = Math.hypot(du, dv)

          if (dist < ARRIVE_EPSILON) {
            agent.uv = agent.target
            if (agent.hotspot) {
              const spot = HOTSPOTS.find((h) => h.id === agent.hotspot)
              agent.activity = spot?.kind === 'bench' ? 'sitting' : 'atGate'
              agent.wait = randomBetween(4, 9)
            } else {
              agent.activity = 'idle'
              agent.wait = randomBetween(1.2, 4)
            }
          } else {
            // 뒤쪽(v가 작은 곳)일수록 원근상 느리게 보이도록 살짝 줄인다.
            const speed = WALK_SPEED * (0.75 + agent.uv.v * 0.4)
            const move = Math.min(speed * dt, dist)
            agent.uv = {
              u: agent.uv.u + (du / dist) * move,
              v: agent.uv.v + (dv / dist) * move,
            }
            if (Math.abs(du) > 1e-4) agent.facing = du > 0 ? 1 : -1
          }
          continue
        }

        agent.wait -= dt
        if (agent.wait > 0) continue

        // 대기가 끝났다 — 다음 목적지를 고른다.
        agent.hotspot = null
        const free = HOTSPOTS.filter((h) => !taken.has(h.id))
        if (free.length > 0 && Math.random() < HOTSPOT_CHANCE) {
          const spot = free[Math.floor(Math.random() * free.length)]
          agent.target = spot.uv
          agent.hotspot = spot.id
          taken.add(spot.id)
        } else {
          agent.target = randomSpot()
        }
        agent.activity = 'walking'
      }

      setTick((t) => (t + 1) % 1_000_000)
      frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [enabled])

  return agentsRef.current
}
