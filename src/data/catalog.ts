import type { CatalogItem, DecorItem, OutfitItem, OutfitSet, OutfitSlot } from '../types'

/** 재화 이름. 코지한 정원 톤에 맞춰 도토리로 잡았다. */
export const CURRENCY_NAME = '도토리'
export const CURRENCY_ICON = '🌰'

/**
 * 상점 카탈로그 (스펙 9장). 서버 없이 코드에 정적으로 둔다.
 *
 * activeSeasons 가 빈 배열이면 상시 판매,
 * 값이 있으면 그 'YYYY-MM' 에만 상점에 노출된다.
 * 시즌 한정의 재판매는 자동 로직 없이 이 배열에 연-월을 손으로 추가해 관리한다.
 *
 * 지금은 모든 물건이 무료다. 재화(도토리)는 계속 모이지만 값을 치르지 않으므로,
 * 상점은 '고르는 곳'이고 도토리는 나중에 유료 품목을 들일 때를 위한 자리로 남는다.
 */

/**
 * 의상은 상의·하의 두 칸으로 나뉘고, 칸마다 세 벌씩 있다.
 * 모양(shape)이 서로 달라야 색만 바뀐 게 아니라 갈아입은 티가 난다.
 */
const TOPS: OutfitItem[] = [
  {
    id: 'top_tee_cream',
    name: '크림 티셔츠',
    type: 'outfit',
    slot: 'top',
    shape: 'tee',
    tier: 'common',
    price: 0,
    activeSeasons: [],
    color: '#fbeed3',
    shade: '#cfae7f',
  },
  {
    id: 'top_hoodie_mint',
    name: '민트 후드',
    type: 'outfit',
    slot: 'top',
    shape: 'hoodie',
    tier: 'common',
    price: 0,
    activeSeasons: [],
    color: '#bde8d4',
    shade: '#6fae95',
  },
  {
    id: 'top_knit_apricot',
    name: '살구 니트',
    type: 'outfit',
    slot: 'top',
    shape: 'knit',
    tier: 'common',
    price: 0,
    activeSeasons: [],
    color: '#ffd2ab',
    shade: '#d99a63',
  },
]

const BOTTOMS: OutfitItem[] = [
  {
    id: 'bottom_pants_denim',
    name: '데님 바지',
    type: 'outfit',
    slot: 'bottom',
    shape: 'pants',
    tier: 'common',
    price: 0,
    activeSeasons: [],
    color: '#9cb6d8',
    shade: '#6b86ab',
  },
  {
    id: 'bottom_skirt_berry',
    name: '베리 치마',
    type: 'outfit',
    slot: 'bottom',
    shape: 'skirt',
    tier: 'common',
    price: 0,
    activeSeasons: [],
    color: '#e6a8c4',
    shade: '#b06a8c',
  },
  {
    id: 'bottom_shorts_moss',
    name: '이끼 반바지',
    type: 'outfit',
    slot: 'bottom',
    shape: 'shorts',
    tier: 'common',
    price: 0,
    activeSeasons: [],
    color: '#b8d99a',
    shade: '#7fa45f',
  },
]

const OUTFITS: OutfitItem[] = [...TOPS, ...BOTTOMS]

/**
 * 소품 크기 (무대 높이 대비 %). 캐릭터 키가 12 다.
 *
 * 처음 잡은 값은 마당에 놓고 보면 죄다 발밑의 조약돌처럼 작아 보였다.
 * width 는 height 와 함께 가로세로 비율로만 쓰이므로, 둘을 같은 비율로
 * 키워야 그림이 찌그러지지 않는다.
 */
const DECOR: DecorItem[] = [
  {
    id: 'decor_stone_small',
    name: '동그란 돌',
    type: 'decor',
    tier: 'common',
    price: 0,
    activeSeasons: [],
    width: 7.5,
    height: 6,
    anchorY: 5,
    art: 'stone',
  },
  {
    id: 'decor_grass_tuft',
    name: '잔디 뭉치',
    type: 'decor',
    tier: 'common',
    price: 0,
    activeSeasons: [],
    width: 7.5,
    height: 6.8,
    anchorY: 5,
    art: 'grasstuft',
  },
  {
    id: 'decor_wildflower',
    name: '들꽃 무리',
    type: 'decor',
    tier: 'common',
    price: 0,
    activeSeasons: [],
    width: 8.3,
    height: 7.5,
    anchorY: 5,
    art: 'wildflower',
  },
  {
    id: 'decor_stump',
    name: '나무 그루터기',
    type: 'decor',
    tier: 'common',
    price: 0,
    activeSeasons: [],
    width: 9,
    height: 8.3,
    anchorY: 5,
    art: 'stump',
  },
  {
    id: 'decor_watering_can',
    name: '물뿌리개',
    type: 'decor',
    tier: 'common',
    price: 0,
    activeSeasons: [],
    width: 9,
    height: 7.5,
    anchorY: 5,
    art: 'wateringcan',
  },
  {
    id: 'decor_signpost',
    name: '작은 표지판',
    type: 'decor',
    tier: 'common',
    price: 0,
    activeSeasons: [],
    width: 9.8,
    height: 9,
    anchorY: 5,
    art: 'signpost',
  },
  {
    id: 'decor_bush_small',
    name: '작은 덤불',
    type: 'decor',
    tier: 'common',
    price: 0,
    activeSeasons: [],
    width: 10.5,
    height: 10.5,
    anchorY: 5,
    art: 'bush',
  },
  {
    id: 'decor_mushroom',
    name: '버섯 삼형제',
    type: 'decor',
    tier: 'common',
    price: 0,
    activeSeasons: [],
    width: 9,
    height: 9,
    anchorY: 5,
    art: 'mushroom',
  },
  {
    id: 'decor_flowerpot',
    name: '화분',
    type: 'decor',
    tier: 'common',
    price: 0,
    activeSeasons: [],
    width: 8.3,
    height: 12,
    anchorY: 5,
    art: 'flowerpot',
  },
  {
    id: 'decor_bench',
    name: '나무 벤치',
    type: 'decor',
    tier: 'rare',
    price: 0,
    activeSeasons: [],
    width: 16.5,
    height: 12,
    anchorY: 8,
    art: 'bench',
  },
  {
    id: 'decor_lantern',
    name: '정원 등',
    type: 'decor',
    tier: 'rare',
    price: 0,
    activeSeasons: [],
    width: 7.5,
    height: 19.5,
    anchorY: 5,
    art: 'lantern',
  },
  {
    id: 'tree_zelkova',
    name: '느티나무',
    type: 'decor',
    tier: 'seasonal',
    price: 0,
    activeSeasons: ['2026-09', '2026-10'],
    width: 21,
    height: 33,
    anchorY: 5,
    art: 'tree',
  },
  {
    id: 'decor_pumpkin_small',
    name: '작은 호박',
    type: 'decor',
    tier: 'seasonal',
    price: 0,
    activeSeasons: ['2026-10'],
    width: 9,
    height: 7.5,
    anchorY: 5,
    art: 'pumpkin',
  },
]

export const CATALOG: CatalogItem[] = [...OUTFITS, ...DECOR]

const BY_ID = new Map(CATALOG.map((item) => [item.id, item]))

export const itemById = (id: string): CatalogItem | undefined => BY_ID.get(id)

export function outfitById(id: string | null | undefined): OutfitItem | undefined {
  if (!id) return undefined
  const item = BY_ID.get(id)
  return item?.type === 'outfit' ? item : undefined
}

/** 그 칸(상의/하의)에 들어가는 옷만 돌려준다. 잘못된 칸의 id는 무시한다. */
export function outfitInSlot(id: string | null | undefined, slot: OutfitSlot) {
  const item = outfitById(id)
  return item?.slot === slot ? item : undefined
}

export const outfitsOfSlot = (slot: OutfitSlot): OutfitItem[] =>
  OUTFITS.filter((item) => item.slot === slot)

export function decorById(id: string): DecorItem | undefined {
  const item = BY_ID.get(id)
  return item?.type === 'decor' ? item : undefined
}

/** 그 달에 상점에 노출되는 물건인지. */
export const isOnSale = (item: CatalogItem, month: string): boolean =>
  item.activeSeasons.length === 0 || item.activeSeasons.includes(month)

/** 태어난 캐릭터가 기본으로 입고 나오는 한 벌. */
export const DEFAULT_OUTFIT: OutfitSet = {
  top: 'top_tee_cream',
  bottom: 'bottom_pants_denim',
}

/** 처음부터 들고 시작하는 옷 — 기본 한 벌은 사지 않아도 입을 수 있다. */
export const STARTER_OUTFITS = [DEFAULT_OUTFIT.top, DEFAULT_OUTFIT.bottom].filter(
  (id): id is string => id !== null,
)

export const TIER_LABEL: Record<CatalogItem['tier'], string> = {
  common: '일반',
  rare: '레어',
  seasonal: '시즌 한정',
}

export const SLOT_LABEL: Record<OutfitSlot, string> = {
  top: '상의',
  bottom: '하의',
}
