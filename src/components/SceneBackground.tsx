import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import { paletteFor } from '../data/season'
import type { ScenePalette } from '../data/season'
import { SceneArt } from './SceneArt'
import './SceneBackground.css'

/**
 * 배경 레이어 (스펙 4장).
 *
 * 그림 자체는 SceneArt 가 벡터로 그리고, 포근한 질감 — 은은한 라이팅과 그레인 —
 * 은 그 위에 CSS로 덮는다. 질감을 그림에 굽지 않고 코드로 얹기 때문에
 * 계절 팔레트가 어떻게 바뀌어도 같은 질감이 일관되게 유지된다.
 */
export function SceneBackground({ month }: { month: string }) {
  const palette = paletteFor(month)

  return (
    <div className="bg" aria-hidden="true">
      <SceneArt palette={palette} />

      {/* 가을에는 잎이 계속 내린다 — 정지 화면에 계절을 가장 크게 들여놓는 한 겹 */}
      {palette.fallenLeaves && <FallingLeaves palette={palette} />}

      {/* 가운데로 빛이 모이는 비네팅 */}
      <div className="bg__light" />

      {/* 종이 그레인 */}
      <div className="bg__grain" />
    </div>
  )
}

/** 잎 하나가 화면을 가로질러 내려오는 데 걸리는 시간의 범위(초). */
const FALL_MIN = 9
const FALL_SPAN = 7

function FallingLeaves({ palette }: { palette: ScenePalette }) {
  /*
   * 잎의 자리·속도는 고정 난수로 굽는다. 매 렌더마다 새로 뽑으면 부모가 다시
   * 그릴 때마다 잎이 순간이동하고, 무엇보다 애니메이션이 처음부터 다시 시작된다.
   */
  const leaves = useMemo(() => {
    let state = 424242
    const next = () => {
      state = (state * 1664525 + 1013904223) % 4294967296
      return state / 4294967296
    }
    const tints = [palette.accent, palette.canopy[0], palette.canopy[1], palette.canopy[2]]

    return Array.from({ length: 14 }, (_, i) => ({
      key: i,
      style: {
        left: `${next() * 100}%`,
        width: `${9 + next() * 8}px`,
        background: tints[i % tints.length],
        // 음수 지연으로 시작해, 화면을 켠 순간 이미 잎이 흩날리는 중이게 한다.
        animationDelay: `${-next() * (FALL_MIN + FALL_SPAN)}s`,
        animationDuration: `${FALL_MIN + next() * FALL_SPAN}s`,
        '--leaf-drift': `${(next() - 0.5) * 26}vw`,
        '--leaf-spin': `${420 + next() * 520}deg`,
      } as CSSProperties,
    }))
  }, [palette])

  return (
    <div className="bg__leaves">
      {leaves.map((leaf) => (
        <span key={leaf.key} className="bg__leaf" style={leaf.style} />
      ))}
    </div>
  )
}
