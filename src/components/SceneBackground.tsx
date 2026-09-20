import { paletteFor } from '../data/season'
import { SceneArt } from './SceneArt'
import './SceneBackground.css'

/**
 * 배경 그림 레이어 (스펙 4장).
 *
 * 포근한 질감 — 비네팅·그레인 — 과 떨어지는 잎은 여기가 아니라 Stage 가 화면
 * 전체에 덮는다. 프레임 안에만 걸면 세로로 긴 화면에서 프레임 가장자리를 따라
 * 눌린 자국이 생겨, 위아래로 이어 붙인 하늘·땅과 이음매가 드러난다.
 */
export function SceneBackground({ month }: { month: string }) {
  return (
    <div className="bg" aria-hidden="true">
      <SceneArt palette={paletteFor(month)} />
    </div>
  )
}
