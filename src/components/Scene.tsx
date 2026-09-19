import './Scene.css'

/**
 * 화면 전체를 채우는 배경 씬. 하늘 → 먼 언덕 → 잔디 순서로 레이어를 쌓는다.
 * 순수 장식이라 스크린리더에서는 감춘다.
 */
export function Scene() {
  return (
    <div className="scene" aria-hidden="true">
      <div className="scene__sky" />
      <div className="scene__sun" />

      <div className="scene__cloud scene__cloud--a" />
      <div className="scene__cloud scene__cloud--b" />
      <div className="scene__cloud scene__cloud--c" />

      <svg className="scene__hills" viewBox="0 0 1440 260" preserveAspectRatio="none">
        <path
          className="scene__hill scene__hill--far"
          d="M0 150 C 180 90, 320 90, 480 140 C 640 190, 780 80, 960 110 C 1120 136, 1280 96, 1440 130 L1440 260 L0 260 Z"
        />
        <path
          className="scene__hill scene__hill--mid"
          d="M0 200 C 200 150, 360 168, 540 196 C 720 224, 880 150, 1080 172 C 1240 190, 1340 176, 1440 186 L1440 260 L0 260 Z"
        />
      </svg>

      <div className="scene__grass">
        <svg className="scene__grass-detail" viewBox="0 0 1440 400" preserveAspectRatio="none">
          {/* 잔디 위 은은한 밝은 띠 — 빛이 닿는 느낌 */}
          <ellipse cx="720" cy="40" rx="900" ry="70" fill="rgba(255,255,255,0.18)" />
        </svg>
      </div>
    </div>
  )
}
