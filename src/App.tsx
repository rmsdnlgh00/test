import { useEffect, useMemo, useRef, useState } from 'react'
import { useGameStore } from './hooks/useGameStore'
import { useWanderers } from './hooks/useWanderers'
import { useDecorDrag } from './hooks/useDecorDrag'
import { Stage } from './components/Stage'
import { DiaryComposer } from './screens/DiaryComposer'
import { Shop } from './screens/Shop'
import { DressingRoom } from './screens/DressingRoom'
import { DecorDrawer } from './screens/DecorDrawer'
import { CURRENCY_ICON, CURRENCY_NAME, decorById } from './data/catalog'
import { MOOD_META } from './lib/mood'
import { currentMonth, formatMonth, monthOf, shiftMonth, todayISO } from './lib/date'
import './App.css'

type Screen = 'none' | 'diary' | 'shop' | 'dress'

const isDebug = () =>
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug')

export function App() {
  const store = useGameStore()
  const [viewMonth, setViewMonth] = useState(currentMonth)
  const [screen, setScreen] = useState<Screen>('none')
  const [decorating, setDecorating] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  const debug = useMemo(isDebug, [])

  const today = todayISO()
  const thisMonth = currentMonth()
  const isThisMonth = viewMonth === thisMonth
  const todayEntry = store.entryOf(today)

  /** 이번 달(혹은 보고 있는 달)에 태어난 캐릭터들만 무대에 세운다 — 스펙 3장. */
  const monthEntries = useMemo(
    () => store.entries.filter((entry) => monthOf(entry.date) === viewMonth),
    [store.entries, viewMonth],
  )

  // 꾸미기 중에는 캐릭터 애니메이션을 멈춘다 (스펙 8장).
  const agents = useWanderers(monthEntries, !decorating)
  const drag = useDecorDrag(frameRef, store)

  /** 넘겨볼 수 있는 가장 이른 달 — 첫 기록이 있는 달. */
  const earliestMonth = store.entries.length > 0 ? monthOf(store.entries[0].date) : thisMonth
  const canGoBack = viewMonth > earliestMonth
  const canGoForward = viewMonth < thisMonth

  // 접속 보상은 한 번만 알려 주고 치운다.
  const { dailyReward, clearDailyReward } = store
  useEffect(() => {
    if (!dailyReward) return
    setToast(`캐릭터들이 ${CURRENCY_ICON} ${CURRENCY_NAME} ${dailyReward.gained}개를 모아 왔어요`)
    clearDailyReward()
  }, [dailyReward, clearDailyReward])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const goToMonth = (offset: number) => {
    setDecorating(false)
    setViewMonth((month) => shiftMonth(month, offset))
  }

  const handleWrite = (text: string) => {
    const entry = store.writeEntry(today, text)
    setScreen('none')
    setViewMonth(thisMonth)
    setToast(`${MOOD_META[entry.mood].emoji} ${MOOD_META[entry.mood].label} 캐릭터가 태어났어요`)
  }

  const selectedDecorName = drag.selectedUid
    ? (decorById(
        store.inventory.placedDecor.find((d) => d.uid === drag.selectedUid)?.itemId ?? '',
      )?.name ?? null)
    : null

  return (
    <div className="app">
      <Stage
        ref={frameRef}
        month={viewMonth}
        agents={agents}
        placed={store.inventory.placedDecor}
        showGrid={decorating}
        debug={debug}
        draggingUid={drag.draggingUid}
        onDecorPointerDown={decorating ? drag.onDecorPointerDown : undefined}
      />

      {!decorating && (
        <>
          <header className="hud hud--top">
            <div className="monthnav">
              <button
                className="monthnav__arrow"
                type="button"
                disabled={!canGoBack}
                onClick={() => goToMonth(-1)}
                aria-label="저번 달 보기"
              >
                ‹
              </button>
              <div className="monthnav__label">
                <strong className="display">{formatMonth(viewMonth)}</strong>
                <span>
                  {isThisMonth
                    ? monthEntries.length === 0
                      ? '일기를 쓰면 첫 캐릭터가 태어나요'
                      : `${monthEntries.length}명이 마을을 걷고 있어요`
                    : `그 달의 캐릭터 ${monthEntries.length}명`}
                </span>
              </div>
              <button
                className="monthnav__arrow"
                type="button"
                disabled={!canGoForward}
                onClick={() => goToMonth(1)}
                aria-label="다음 달 보기"
              >
                ›
              </button>
            </div>

            <span className="wallet-chip wallet-chip--hud">
              {CURRENCY_ICON} {store.wallet.balance}
            </span>
          </header>

          <nav className="hud hud--bottom" aria-label="메뉴">
            {isThisMonth ? (
              <button
                className="btn btn--primary display"
                type="button"
                onClick={() => setScreen('diary')}
              >
                {todayEntry ? '오늘 기록 고치기' : '오늘 기록하기'}
              </button>
            ) : (
              <button
                className="btn btn--primary display"
                type="button"
                onClick={() => setViewMonth(thisMonth)}
              >
                이번 달로 돌아가기
              </button>
            )}
            <button className="btn display" type="button" onClick={() => setScreen('shop')}>
              상점
            </button>
            <button className="btn display" type="button" onClick={() => setScreen('dress')}>
              캐릭터 꾸미기
            </button>
            <button
              className="btn display"
              type="button"
              disabled={!isThisMonth}
              onClick={() => setDecorating(true)}
            >
              공간 꾸미기
            </button>
          </nav>
        </>
      )}

      {decorating && (
        <DecorDrawer
          available={store.availableDecor}
          placedCount={store.inventory.placedDecor.length}
          selectedName={selectedDecorName}
          onAdd={drag.addFromDrawer}
          onRemoveSelected={drag.removeSelected}
          onDone={() => {
            drag.clearSelection()
            setDecorating(false)
          }}
        />
      )}

      {toast && (
        <p className="toast" role="status">
          {toast}
        </p>
      )}

      <DiaryComposer
        open={screen === 'diary'}
        date={today}
        entry={todayEntry}
        onSubmit={handleWrite}
        onClose={() => setScreen('none')}
      />

      <Shop
        open={screen === 'shop'}
        month={thisMonth}
        wallet={store.wallet}
        inventory={store.inventory}
        onBuy={store.buy}
        onClose={() => setScreen('none')}
      />

      <DressingRoom
        open={screen === 'dress'}
        entries={store.entries}
        ownedOutfits={store.inventory.ownedOutfits}
        onSetOutfit={store.setOutfit}
        onClose={() => setScreen('none')}
      />
    </div>
  )
}
