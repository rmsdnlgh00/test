import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import type { ScenePalette } from '../data/season'
import './FallingLeaves.css'

/** 잎 하나가 화면을 가로질러 내려오는 데 걸리는 시간의 범위(초). */
const FALL_MIN = 9
const FALL_SPAN = 7

/**
 * 가을에 계속 내리는 잎.
 *
 * 무대 프레임 안이 아니라 화면 전체를 덮는 자리에 놓는다. 세로로 긴 화면에서는
 * 프레임이 화면 가운데 띠만 차지해서, 프레임 안에 두면 잎이 그 띠 안에서만
 * 내리다 만다.
 */
export function FallingLeaves({ palette }: { palette: ScenePalette }) {
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
    <div className="leaves" aria-hidden="true">
      {leaves.map((leaf) => (
        <span key={leaf.key} className="leaves__leaf" style={leaf.style} />
      ))}
    </div>
  )
}
