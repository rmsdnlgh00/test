import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { DiaryEntry, Inventory, Mood, OutfitSet, OutfitSlot, PlacedDecor, Wallet } from '../types'
import { STORAGE_KEYS, readJson, writeJson } from '../lib/storage'
import { createId, todayISO } from '../lib/date'
import { detectMood } from '../lib/mood'
import { collectDailyCurrency } from '../lib/currency'
import { DEFAULT_OUTFIT, STARTER_OUTFITS, itemById, outfitInSlot } from '../data/catalog'

const MOODS: Mood[] = ['happy', 'sad', 'angry', 'neutral']

/**
 * 저장된 의상을 현재 모델로 맞춘다.
 *
 * 예전 저장본은 의상이 한 칸(문자열 하나)이었다. 그 id 들은 지금 카탈로그에
 * 없으므로 살려낼 수가 없어, 기본 한 벌을 입혀 내보낸다.
 */
function reviveOutfit(raw: unknown): OutfitSet {
  if (typeof raw === 'object' && raw !== null) {
    const o = raw as Record<string, unknown>
    return {
      top: outfitInSlot(typeof o.top === 'string' ? o.top : null, 'top')?.id ?? null,
      bottom: outfitInSlot(typeof o.bottom === 'string' ? o.bottom : null, 'bottom')?.id ?? null,
    }
  }
  return { ...DEFAULT_OUTFIT }
}

function reviveEntries(raw: unknown): DiaryEntry[] | null {
  if (!Array.isArray(raw)) return null
  return raw
    .filter((value) => {
      if (typeof value !== 'object' || value === null) return false
      const e = value as Record<string, unknown>
      return (
        typeof e.date === 'string' && typeof e.text === 'string' && MOODS.includes(e.mood as Mood)
      )
    })
    .map((value) => {
      const e = value as Record<string, unknown>
      return {
        date: e.date as string,
        text: e.text as string,
        mood: e.mood as Mood,
        outfit: reviveOutfit(e.outfit),
        createdAt: typeof e.createdAt === 'number' ? e.createdAt : Date.now(),
      }
    })
}

function reviveWallet(raw: unknown): Wallet | null {
  if (typeof raw !== 'object' || raw === null) return null
  const w = raw as Record<string, unknown>
  if (typeof w.balance !== 'number') return null
  return {
    balance: w.balance,
    lastCollectedDate: typeof w.lastCollectedDate === 'string' ? w.lastCollectedDate : null,
  }
}

function reviveInventory(raw: unknown): Inventory | null {
  if (typeof raw !== 'object' || raw === null) return null
  const i = raw as Record<string, unknown>
  const strings = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : []
  const placed = Array.isArray(i.placedDecor)
    ? i.placedDecor.filter((value): value is PlacedDecor => {
        if (typeof value !== 'object' || value === null) return false
        const d = value as Record<string, unknown>
        return (
          typeof d.uid === 'string' &&
          typeof d.itemId === 'string' &&
          typeof d.x === 'number' &&
          typeof d.y === 'number'
        )
      })
    : []
  // 카탈로그에서 사라진 옛 옷 id 는 버린다 — 상점에도 옷장에도 없는 이름이 남지 않게.
  const ownedOutfits = strings(i.ownedOutfits).filter((id) => itemById(id)?.type === 'outfit')
  return {
    ownedOutfits: Array.from(new Set([...STARTER_OUTFITS, ...ownedOutfits])),
    ownedDecor: strings(i.ownedDecor),
    placedDecor: placed,
  }
}

const EMPTY_INVENTORY: Inventory = {
  ownedOutfits: [...STARTER_OUTFITS],
  ownedDecor: [],
  placedDecor: [],
}

export interface DailyReward {
  gained: number
}

export function useGameStore() {
  const [entries, setEntries] = useState<DiaryEntry[]>(() =>
    readJson(STORAGE_KEYS.entries, [], reviveEntries),
  )
  const [wallet, setWallet] = useState<Wallet>(() =>
    readJson(STORAGE_KEYS.wallet, { balance: 0, lastCollectedDate: null }, reviveWallet),
  )
  const [inventory, setInventory] = useState<Inventory>(() =>
    readJson(STORAGE_KEYS.inventory, EMPTY_INVENTORY, reviveInventory),
  )
  /** 이번 접속에서 받은 일일 재화. 화면에 한 번 알려주고 비운다. */
  const [dailyReward, setDailyReward] = useState<DailyReward | null>(null)

  useEffect(() => writeJson(STORAGE_KEYS.entries, entries), [entries])
  useEffect(() => writeJson(STORAGE_KEYS.wallet, wallet), [wallet])
  useEffect(() => writeJson(STORAGE_KEYS.inventory, inventory), [inventory])

  /**
   * 일일 재화 수급 — 앱 로드 시 딱 1회 (스펙 6장).
   * StrictMode의 이펙트 두 번 실행이나 리렌더로 두 번 굴리지 않도록 ref로 막는다.
   */
  const collected = useRef(false)
  useEffect(() => {
    if (collected.current) return
    collected.current = true
    const today = todayISO()
    setWallet((prev) => {
      const result = collectDailyCurrency(entries.length, prev.lastCollectedDate, today)
      if (!result) return prev
      if (result.gained > 0) setDailyReward({ gained: result.gained })
      return { balance: prev.balance + result.gained, lastCollectedDate: result.newLastCollectedDate }
    })
    // entries는 첫 렌더의 값이면 충분하다 — 로드 시점 기준 1회 판정이므로 의존성에 넣지 않는다.
  }, [])

  const entryOf = useCallback(
    (date: string) => entries.find((entry) => entry.date === date),
    [entries],
  )

  /**
   * 오늘의 일기를 쓴다. 하루 1개라 같은 날짜면 덮어쓰되,
   * 이미 입혀 둔 옷과 최초 작성 시각은 보존한다.
   */
  const writeEntry = useCallback(
    (date: string, text: string): DiaryEntry => {
      const existing = entries.find((entry) => entry.date === date)
      const saved: DiaryEntry = {
        date,
        text,
        mood: detectMood(text),
        outfit: existing?.outfit ?? { ...DEFAULT_OUTFIT },
        createdAt: existing?.createdAt ?? Date.now(),
      }
      setEntries((prev) =>
        [...prev.filter((entry) => entry.date !== date), saved].sort((a, b) =>
          a.date.localeCompare(b.date),
        ),
      )
      return saved
    },
    [entries],
  )

/** 아무 날짜의 캐릭터에게나 상의·하의를 따로 입히거나 벗긴다 (스펙 2장). */
  const setOutfit = useCallback((date: string, slot: OutfitSlot, itemId: string | null) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.date === date ? { ...entry, outfit: { ...entry.outfit, [slot]: itemId } } : entry,
      ),
    )
  }, [])

  /** 상점 구매. 잔액이 모자라거나 이미 가진 물건이면 false. */
  const buy = useCallback(
    (itemId: string): boolean => {
      const item = itemById(itemId)
      if (!item) return false
      const owned =
        item.type === 'outfit'
          ? inventory.ownedOutfits.includes(itemId)
          : inventory.ownedDecor.includes(itemId)
      if (owned || wallet.balance < item.price) return false

      setWallet((prev) => ({ ...prev, balance: prev.balance - item.price }))
      setInventory((prev) =>
        item.type === 'outfit'
          ? { ...prev, ownedOutfits: [...prev.ownedOutfits, itemId] }
          : { ...prev, ownedDecor: [...prev.ownedDecor, itemId] },
      )
      return true
    },
    [inventory.ownedDecor, inventory.ownedOutfits, wallet.balance],
  )

  /** 소품을 놓고, 바로 이어서 끌 수 있도록 배치 인스턴스 id를 돌려준다. */
  const placeDecor = useCallback((itemId: string, x: number, y: number): string => {
    const uid = createId()
    setInventory((prev) => ({
      ...prev,
      placedDecor: [...prev.placedDecor, { uid, itemId, x, y }],
    }))
    return uid
  }, [])

  const moveDecor = useCallback((uid: string, x: number, y: number) => {
    setInventory((prev) => ({
      ...prev,
      placedDecor: prev.placedDecor.map((d) => (d.uid === uid ? { ...d, x, y } : d)),
    }))
  }, [])

  /** 배치를 거두면 다시 보유 목록(창고)으로 돌아간다. */
  const removeDecor = useCallback((uid: string) => {
    setInventory((prev) => ({
      ...prev,
      placedDecor: prev.placedDecor.filter((d) => d.uid !== uid),
    }))
  }, [])

  /** 보유 수량에서 이미 배치한 개수를 뺀 '서랍에 남은' 소품. */
  const availableDecor = useMemo(() => {
    const placedCount = new Map<string, number>()
    for (const d of inventory.placedDecor) {
      placedCount.set(d.itemId, (placedCount.get(d.itemId) ?? 0) + 1)
    }
    return inventory.ownedDecor.filter((id) => (placedCount.get(id) ?? 0) === 0)
  }, [inventory.ownedDecor, inventory.placedDecor])

  return {
    entries,
    wallet,
    inventory,
    availableDecor,
    dailyReward,
    clearDailyReward: useCallback(() => setDailyReward(null), []),
    entryOf,
    writeEntry,
    setOutfit,
    buy,
    placeDecor,
    moveDecor,
    removeDecor,
  }
}

export type GameStore = ReturnType<typeof useGameStore>
