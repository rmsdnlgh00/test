import { paletteFor } from '../data/season'
import { SceneArt } from './SceneArt'
import './SceneBackground.css'

/**
 * 배경 레이어 (스펙 4장).
 *
 * 그림 자체는 SceneArt 가 벡터로 그리고, 포근한 질감 — 은은한 라이팅과 그레인 —
 * 은 그 위에 CSS로 덮는다. 질감을 그림에 굽지 않고 코드로 얹기 때문에
 * 계절 팔레트가 어떻게 바뀌어도 같은 질감이 일관되게 유지된다.
 *
 * 떨어지는 잎은 여기가 아니라 Stage 가 화면 전체에 깐다 — 세로 화면에서는
 * 이 프레임이 화면 가운데 띠만 차지하기 때문이다.
 */
export function SceneBackground({ month }: { month: string }) {
  return (
    <div className="bg" aria-hidden="true">
      <SceneArt palette={paletteFor(month)} />

      {/* 가운데로 빛이 모이는 비네팅 */}
      <div className="bg__light" />

      {/* 종이 그레인 */}
      <div className="bg__grain" />
    </div>
  )
}
