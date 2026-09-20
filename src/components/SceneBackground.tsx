import { backgroundFor, seasonTintFor } from '../data/scene'
import './SceneBackground.css'

/**
 * 배경 레이어 (스펙 4장).
 *
 * 이미지는 한 장만 깔고, 포근한 질감 — 은은한 라이팅과 그레인 — 은
 * 이미지가 아니라 CSS로 덮는다. 그래야 월별 배경이 몇 장으로 늘어나도
 * 질감이 똑같이 유지된다.
 */
export function SceneBackground({ month }: { month: string }) {
  const src = backgroundFor(month)
  const tint = seasonTintFor(month)

  return (
    <div className="bg" aria-hidden="true">
      {/* 이미지 로딩 전/실패 시에도 흰 화면이 보이지 않도록 하늘색을 깔아 둔다 */}
      <div className="bg__fallback" />

      <img
        className="bg__image"
        src={src}
        alt=""
        decoding="async"
        fetchPriority="high"
        style={tint ? { filter: tint.filter } : undefined}
      />

      {/* 전용 배경이 없는 달의 계절 보정 */}
      {tint && <div className="bg__season" style={{ background: tint.color }} />}

      {/* 가운데로 빛이 모이는 비네팅 */}
      <div className="bg__light" />

      {/* 종이 그레인 */}
      <div className="bg__grain" />
    </div>
  )
}
