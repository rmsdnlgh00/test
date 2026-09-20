import type { CatalogItem, DecorItem, OutfitItem } from '../types'

/** 재화 이름. 코지한 정원 톤에 맞춰 도토리로 잡았다. */
export const CURRENCY_NAME = '도토리'
export const CURRENCY_ICON = '🌰'

/**
 * 상점 카탈로그 (스펙 9장). 서버 없이 코드에 정적으로 둔다.
 *
 * activeSeasons 가 빈 배열이면 상시 판매,
 * 값이 있으면 그 'YYYY-MM' 에만 상점에 노출된다.
 * 시즌 한정의 재판매는 자동 로직 없이 이 배열에 연-월을 손으로 추가해 관리한다.
 */

const OUTFITS: OutfitItem[] = [
  {
    id: 'outfit_basic_cream',
    name: '기본 크림',
    type: 'outfit',
    tier: 'common',
    price: 0,
    activeSeasons: [],
    color: '#f6e3c5',
    shade: '#c9a87c',
    hat: 'none',
  },
  {
    id: 'outfit_hoodie_mint',
    name: '민트 후드',
    type: 'outfit',
    tier: 'common',
    price: 40,
    activeSeasons: [],
    color: '#bde8d4',
    shade: '#6fae95',
    hat: 'beanie',
  },
  {
    id: 'outfit_apricot_knit',
    name: '살구 니트',
    type: 'outfit',
    tier: 'common',
    price: 40,
    activeSeasons: [],
    color: '#ffd2ab',
    shade: '#d99a63',
    hat: 'none',
  },
  {
    id: 'outfit_berry_cape',
    name: '베리 망토',
    type: 'outfit',
    tier: 'rare',
    price: 120,
    activeSeasons: [],
    color: '#e6a8c4',
    shade: '#b06a8c',
    hat: 'flower',
  },
  {
    id: 'outfit_moss_cloak',
    name: '이끼 망토',
    type: 'outfit',
    tier: 'rare',
    price: 120,
    activeSeasons: [],
    color: '#b8d99a',
    shade: '#7fa45f',
    hat: 'leaf',
  },
  {
    id: 'outfit_harvest_scarf',
    name: '단풍 목도리',
    type: 'outfit',
    tier: 'seasonal',
    price: 180,
    activeSeasons: ['2026-10', '2026-11'],
    color: '#f2a65a',
    shade: '#c06b2f',
    hat: 'leaf',
  },
  {
    id: 'outfit_early_autumn',
    name: '초가을 셔츠',
    type: 'outfit',
    tier: 'seasonal',
    price: 150,
    activeSeasons: ['2026-09'],
    color: '#d8e8b0',
    shade: '#96b167',
    hat: 'none',
  },
]

const DECOR: DecorItem[] = [
  {
    id: 'decor_bush_small',
    name: '작은 덤불',
    type: 'decor',
    tier: 'common',
    price: 30,
    activeSeasons: [],
    width: 7,
    height: 7,
    anchorY: 5,
    art: 'bush',
  },
  {
    id: 'decor_mushroom',
    name: '버섯 삼형제',
    type: 'decor',
    tier: 'common',
    price: 45,
    activeSeasons: [],
    width: 6,
    height: 6,
    anchorY: 5,
    art: 'mushroom',
  },
  {
    id: 'decor_flowerpot',
    name: '화분',
    type: 'decor',
    tier: 'common',
    price: 50,
    activeSeasons: [],
    width: 5.5,
    height: 8,
    anchorY: 5,
    art: 'flowerpot',
  },
  {
    id: 'decor_bench',
    name: '나무 벤치',
    type: 'decor',
    tier: 'rare',
    price: 140,
    activeSeasons: [],
    width: 11,
    height: 8,
    anchorY: 8,
    art: 'bench',
  },
  {
    id: 'decor_lantern',
    name: '정원 등',
    type: 'decor',
    tier: 'rare',
    price: 160,
    activeSeasons: [],
    width: 5,
    height: 13,
    anchorY: 5,
    art: 'lantern',
  },
  {
    id: 'tree_zelkova',
    name: '느티나무',
    type: 'decor',
    tier: 'seasonal',
    price: 120,
    activeSeasons: ['2026-09', '2026-10'],
    width: 14,
    height: 22,
    anchorY: 5,
    art: 'tree',
  },
  {
    id: 'decor_pumpkin_small',
    name: '작은 호박',
    type: 'decor',
    tier: 'seasonal',
    price: 90,
    activeSeasons: ['2026-10'],
    width: 6,
    height: 5,
    anchorY: 5,
    art: 'pumpkin',
  },
]

export const CATALOG: CatalogItem[] = [...OUTFITS, ...DECOR]

const BY_ID = new Map(CATALOG.map((item) => [item.id, item]))

export const itemById = (id: string): CatalogItem | undefined => BY_ID.get(id)

export function outfitById(id: string | null): OutfitItem | undefined {
  if (!id) return undefined
  const item = BY_ID.get(id)
  return item?.type === 'outfit' ? item : undefined
}

export function decorById(id: string): DecorItem | undefined {
  const item = BY_ID.get(id)
  return item?.type === 'decor' ? item : undefined
}

/** 그 달에 상점에 노출되는 물건인지. */
export const isOnSale = (item: CatalogItem, month: string): boolean =>
  item.activeSeasons.length === 0 || item.activeSeasons.includes(month)

/** 처음부터 들고 시작하는 물건. */
export const STARTER_OUTFITS = ['outfit_basic_cream']

export const TIER_LABEL: Record<CatalogItem['tier'], string> = {
  common: '일반',
  rare: '레어',
  seasonal: '시즌 한정',
}
