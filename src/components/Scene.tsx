import './Scene.css'

/**
 * 배경 이미지 경로. `public/` 아래에 파일을 넣고 여기를 그 파일명으로 맞추면 된다.
 * 예) public/background.png → '/background.png'
 */
const BACKGROUND_IMAGE = '/background.png'

/**
 * false 로 바꾸면 이미지 대신 원래의 CSS/SVG 레이어 배경(하늘·해·구름·언덕·잔디)으로 돌아간다.
 */
const USE_IMAGE_BACKGROUND = true

/**
 * 화면 전체를 채우는 배경 씬. 순수 장식이라 스크린리더에서는 감춘다.
 */
export function Scene() {
  return (
    <div className="scene" aria-hidden="true">
      {/* 이미지가 아직 없거나 로드에 실패해도 허전하지 않도록 하늘색은 항상 깔아 둔다 */}
      <div className="scene__sky" />
      {USE_IMAGE_BACKGROUND ? <ImageBackground /> : <LayeredBackground />}
    </div>
  )
}

/** 힉스필드 등에서 만든 이미지 한 장을 화면에 꽉 채운다. */
function ImageBackground() {
  return (
    <>
      <img
        className="scene__photo"
        src={BACKGROUND_IMAGE}
        alt=""
        decoding="async"
        fetchPriority="high"
      />
      {/* 제목과 일기 카드의 글자가 이미지에 묻히지 않도록 위아래만 살짝 눌러 주는 막 */}
      <div className="scene__scrim" />
    </>
  )
}

/** 원래 배경. 하늘 → 먼 언덕 → 잔디 순서로 레이어를 쌓는다. */
function LayeredBackground() {
  return (
    <>
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
    </>
  )
}
