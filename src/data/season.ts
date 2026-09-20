/**
 * 월별 계절 팔레트 (스펙 3장·4장).
 *
 * 배경을 벡터로 그리기 때문에 색 보정 필터를 씌우는 대신 색 자체를 바꾼다.
 * 그래서 9월은 '초록 우세 + 잎끝만 살짝 물듦', 10월은 '완연한 가을'처럼
 * 스펙이 말한 무드 차이를 실제 잎 색 비율로 표현할 수 있다.
 *
 * 색은 채도를 유지한 웜톤 파스텔 — 탁해지지 않도록 회색을 섞지 않는다.
 */
export interface ScenePalette {
  skyTop: string
  skyBottom: string
  cloud: string
  hillFar: string
  hillNear: string
  grassTop: string
  grassBottom: string
  grassLight: string
  soil: string
  soilDark: string
  trunk: string
  trunkDark: string
  /** 잎 색 세 단계 — 어두운 쪽부터 */
  canopy: readonly [string, string, string]
  /** 물든 잎·단풍 색 */
  accent: string
  /** 물든 잎이 차지하는 비중 0~1 */
  accentRatio: number
  water: string
  waterDeep: string
  /** 화단 꽃 색 */
  bloom: readonly [string, string, string]
  fence: string
  fenceDark: string
  path: string
  pathEdge: string
  /** 잔디 위에 떨어진 잎을 그릴지 */
  fallenLeaves: boolean
}

const SPRING: ScenePalette = {
  skyTop: '#a8ddf2',
  skyBottom: '#e9f6ef',
  cloud: '#ffffff',
  hillFar: '#cfe6c0',
  hillNear: '#b3d89c',
  grassTop: '#a8d982',
  grassBottom: '#89c268',
  grassLight: '#c2e69c',
  soil: '#c49a6c',
  soilDark: '#a17a50',
  trunk: '#b08256',
  trunkDark: '#8d6440',
  canopy: ['#7fbf5e', '#95cf72', '#adde8b'],
  accent: '#ffc4dd',
  accentRatio: 0.3,
  water: '#a9dcef',
  waterDeep: '#7cc3dd',
  bloom: ['#ffd9e8', '#fff3c4', '#d9d2f2'],
  fence: '#d2ab7c',
  fenceDark: '#ab8459',
  path: '#e4d9c2',
  pathEdge: '#c9baa0',
  fallenLeaves: false,
}

const SUMMER: ScenePalette = {
  ...SPRING,
  skyTop: '#8fd3ef',
  skyBottom: '#e4f5ec',
  hillFar: '#bfe0ad',
  hillNear: '#9ccf84',
  grassTop: '#93d06f',
  grassBottom: '#72b455',
  grassLight: '#b2e08a',
  canopy: ['#5fa845', '#79bd5c', '#95d176'],
  accent: '#f6e07a',
  accentRatio: 0.06,
  water: '#9ad8ee',
  waterDeep: '#6bbcd9',
  bloom: ['#ffe0a8', '#ffd9e8', '#cfe9ff'],
}

/** 9월 — 아직 초록이 우세하고 잎끝만 살짝 물든다. */
const EARLY_AUTUMN: ScenePalette = {
  ...SUMMER,
  skyTop: '#9dd8ef',
  skyBottom: '#f0f5e4',
  hillFar: '#cfe0a8',
  hillNear: '#a8cc7e',
  grassTop: '#9ccf6c',
  grassBottom: '#7cb457',
  grassLight: '#bfdf8c',
  canopy: ['#69ab4a', '#85be5f', '#a4d07a'],
  accent: '#f2a65a',
  accentRatio: 0.22,
  bloom: ['#ffd9b0', '#fff0bd', '#e8d2f0'],
}

/** 10월 — 완연한 가을. */
const AUTUMN: ScenePalette = {
  skyTop: '#a6d3e8',
  skyBottom: '#fbeed6',
  cloud: '#fffaf0',
  hillFar: '#ddc9a0',
  hillNear: '#c8ab7c',
  grassTop: '#bcc97a',
  grassBottom: '#9aae5e',
  grassLight: '#d6dc98',
  soil: '#bb8c5e',
  soilDark: '#976c44',
  trunk: '#a3754c',
  trunkDark: '#7f5837',
  canopy: ['#cf7a3a', '#e29a4c', '#f0b866'],
  accent: '#d9544a',
  accentRatio: 0.8,
  water: '#a8cfe0',
  waterDeep: '#79aec4',
  bloom: ['#f2a65a', '#e8c46a', '#d98f7a'],
  fence: '#c49a6c',
  fenceDark: '#9c764d',
  path: '#e6d5b6',
  pathEdge: '#c4ab88',
  fallenLeaves: true,
}

/** 11월 — 늦가을, 색이 한 톤 더 내려앉는다. */
const LATE_AUTUMN: ScenePalette = {
  ...AUTUMN,
  skyTop: '#b3cddd',
  skyBottom: '#f5e8d4',
  hillFar: '#d3bc98',
  hillNear: '#bb9e73',
  grassTop: '#b5b878',
  grassBottom: '#95995c',
  grassLight: '#cccd94',
  canopy: ['#b45f32', '#cc7f3f', '#dda05a'],
  accent: '#a8452f',
  accentRatio: 1,
}

const WINTER: ScenePalette = {
  skyTop: '#bcd9ee',
  skyBottom: '#f4f7fb',
  cloud: '#ffffff',
  hillFar: '#e2ebf2',
  hillNear: '#cdddea',
  grassTop: '#e8f1f4',
  grassBottom: '#cfe0e6',
  grassLight: '#f6fbfc',
  soil: '#b9a68f',
  soilDark: '#96836d',
  trunk: '#9c7c5e',
  trunkDark: '#7a5f46',
  canopy: ['#a8bfc4', '#c0d3d6', '#dbe8e9'],
  accent: '#ffffff',
  accentRatio: 0.5,
  water: '#cfe6f0',
  waterDeep: '#a8cddd',
  bloom: ['#ffffff', '#e6f0f6', '#f2e4ea'],
  fence: '#c2ab8e',
  fenceDark: '#9b8161',
  path: '#eaeff2',
  pathEdge: '#cbd8de',
  fallenLeaves: false,
}

const BY_MONTH: Record<number, ScenePalette> = {
  1: WINTER,
  2: WINTER,
  3: SPRING,
  4: SPRING,
  5: SPRING,
  6: SUMMER,
  7: SUMMER,
  8: SUMMER,
  9: EARLY_AUTUMN,
  10: AUTUMN,
  11: LATE_AUTUMN,
  12: WINTER,
}

/** 'YYYY-MM' 에 맞는 팔레트. 알 수 없으면 초여름 톤으로 둔다. */
export function paletteFor(month: string): ScenePalette {
  const index = Number(month.split('-')[1])
  return BY_MONTH[index] ?? SUMMER
}
