/** 감정 4종. 스펙 1장 원칙에 따라 캐릭터 '표정'에만 영향을 준다. */
export type Mood = 'happy' | 'sad' | 'angry' | 'neutral'

/** 화면 비율(%) 좌표. 배경 위의 모든 위치는 이 좌표계로 저장한다. */
export interface Point {
  x: number
  y: number
}

/** 지면 정규화 좌표. u: 왼→오, v: 안쪽(뒤)→앞쪽. 둘 다 0~1. */
export interface Uv {
  u: number
  v: number
}

/** 하루치 기록. 날짜당 최대 1건이라 date가 곧 식별자다. */
export interface DiaryEntry {
  /** YYYY-MM-DD */
  date: string
  text: string
  mood: Mood
  /** 착용 중인 의상 id. 없으면 null */
  outfit: string | null
  createdAt: number
}

export interface Wallet {
  balance: number
  /** 마지막으로 재화 수급을 굴린 날짜 (YYYY-MM-DD) */
  lastCollectedDate: string | null
}

/** 배치된 소품 한 개. 같은 소품을 여러 개 둘 수 있어 uid로 구분한다. */
export interface PlacedDecor {
  uid: string
  itemId: string
  /** 밑동(바닥에 닿는 점)의 위치. 무대 프레임 대비 % */
  x: number
  y: number
}

export interface Inventory {
  ownedOutfits: string[]
  ownedDecor: string[]
  placedDecor: PlacedDecor[]
}

export type ItemType = 'outfit' | 'decor'
export type ItemTier = 'common' | 'rare' | 'seasonal'

interface CatalogItemBase {
  id: string
  name: string
  type: ItemType
  tier: ItemTier
  price: number
  /**
   * 이 배열에 현재 'YYYY-MM'이 들어 있을 때만 상점에 노출된다.
   * 빈 배열이면 상시 판매. 자동 계산 없이 운영자가 직접 관리한다 (스펙 9장).
   */
  activeSeasons: string[]
}

/** 캐릭터가 입는 옷. 몸 색과 머리 장식을 바꾼다. */
export interface OutfitItem extends CatalogItemBase {
  type: 'outfit'
  color: string
  shade: string
  hat: 'none' | 'leaf' | 'beanie' | 'flower'
}

export type DecorArt =
  | 'tree'
  | 'bush'
  | 'pumpkin'
  | 'lantern'
  | 'mushroom'
  | 'bench'
  | 'flowerpot'
  | 'stone'
  | 'grasstuft'
  | 'wildflower'
  | 'stump'
  | 'wateringcan'
  | 'signpost'

/** 공간에 놓는 소품. */
export interface DecorItem extends CatalogItemBase {
  type: 'decor'
  /** 배치 크기. height 는 무대 높이 대비 %, width 는 height 에 대한 가로 비율 기준 */
  width: number
  height: number
  /**
   * 스프라이트 하단에서 밑동까지의 거리 (스프라이트 높이 대비 %).
   * 모든 소품 아트가 밑동을 바닥 근처에 두고 그려져 있어 5 안팎이다.
   * 배치 좌표에 밑동을 정확히 맞춰 놓는 데 쓴다.
   */
  anchorY: number
  art: DecorArt
}

export type CatalogItem = OutfitItem | DecorItem

/** 홈 화면을 돌아다니는 캐릭터 한 마리의 실시간 상태. */
export type AgentActivity = 'walking' | 'idle' | 'sitting' | 'atGate'

export interface Agent {
  date: string
  mood: Mood
  outfit: string | null
  /** 현재 위치 */
  uv: Uv
  /** 이동 목표 */
  target: Uv
  activity: AgentActivity
  /** 남은 대기 시간(초). 0이 되면 다음 목표를 고른다. */
  wait: number
  /** 바라보는 방향. 1이면 오른쪽 */
  facing: 1 | -1
  /** 점유 중인 핫스팟 id */
  hotspot: string | null
}
